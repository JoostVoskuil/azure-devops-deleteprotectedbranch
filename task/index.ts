import * as tl from 'azure-pipelines-task-lib';
import { IGitBranchesResponse, IGitRefUpdate, IGitRepositoriesResponse, IPermissionResonse, IGitRefUpdateResultResponse } from './APIResponses';
import { AzureDevOpsConnection } from './AzureDevOpsConnection';

async function run() {
   try {
      const collectionUri = tl.getEndpointUrl('SYSTEMVSSCONNECTION', true);
      const agentToken = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', true);
      const userToken = getAzureDevOpsInput('PAT');
      const teamProject = getAzureDevOpsVariable('System.TeamProject');
      const teamProjectId = getAzureDevOpsVariable('System.TeamProjectId');

      const repositoryName = getAzureDevOpsInput('repositoryname');
      const branches = getAzureDevOpsInput('branches').split(',');

      tl.debug(`Branches to delete: ${branches}`);

      if (collectionUri === undefined || agentToken === undefined) {
         throw Error(`System.AccessToken is not available.`);
      }

      const agentConnection = new AzureDevOpsConnection(collectionUri, agentToken, teamProject);
      const userConnection = new AzureDevOpsConnection(collectionUri, userToken);

      for (const branch of branches) {
         tl.debug(`Validating: ${branch}`);
         if (!branch.toLowerCase().trim().startsWith('release/') && !branch.toLowerCase().trim().startsWith('hotfix/')) {
            throw (`Branch ${branch.trim()} is not a valid branch. Branches should start with 'release/' or 'hotfix/')`);
         }
         else if (!branch.split("/").pop()) {
            throw (`Branch ${branch.trim()} is not a valid branch. Branches should end with '/<branchname>' )`);
         }
         else {
            tl.debug(`${branch} is a valid input.`);
         }
      }

      const gitRepositories = (await agentConnection.get<IGitRepositoriesResponse>(`_apis/git/repositories?api-version=6.1-preview.1`)).result?.value;
      if (!gitRepositories) {
         throw `No git repostitories found in this project.`;
      }

      tl.debug(`Found ${gitRepositories?.length} gitrepositories in this project.`);
      const gitRepoToBeChanged = gitRepositories.find(g => g.name === repositoryName);
      if (!gitRepoToBeChanged) {
         throw `Cannot find git repository ${repositoryName}`;
      }
      else if (gitRepoToBeChanged.isDisabled) {
         throw `Git repository ${repositoryName} is disabled. Cannot delete branch.`;
      }

      const securityNamespaceId = `2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87`;
      const token = `repoV2/${teamProjectId}/${gitRepoToBeChanged.id}`;
      const permissions = '16'; // This is Branch create permissions

      const permission = (await userConnection.get<IPermissionResonse>(`_apis/permissions/${securityNamespaceId}/${permissions}?tokens=${token}&alwaysAllowAdministrators=false&api-version=6.1-preview.2`)).result?.value;
      if (!permission || !permission[0]) {
         throw `User that triggered the pipeline does not have 'Create branch' permissions on repository '${repositoryName}'.`;
      }
      else {
         console.log(`User that triggered the pipeline has 'Create branch' permissions on repository '${repositoryName}'.`);
      }

      const foundBranches = (await agentConnection.get<IGitBranchesResponse>(`_apis/git/repositories/${gitRepoToBeChanged.id}/refs?api-version=6.0-preview.1`)).result?.value;

      const body: IGitRefUpdate[] = [];
      for (const branch of branches) {
         const fullBranchName = `refs/heads/${branch.trim()}`
         const branchToBeDeleted = foundBranches?.find(b => b.name === fullBranchName);
         if (!branchToBeDeleted) {
            tl.warning(`Cannot find branch '${fullBranchName}' in repository '${repositoryName}', skipping.`);
         }
         else {
            const branchToDeleted: IGitRefUpdate = {
               name: fullBranchName,
               oldObjectId: branchToBeDeleted.objectId,
               newObjectId: "0000000000000000000000000000000000000000"
            };
            body.push(branchToDeleted);
         }
      }
      if (body.length > 0) {
         const results = (await agentConnection.create<IGitRefUpdateResultResponse>(`_apis/git/repositories/${gitRepoToBeChanged.id}/refs?api-version=6.0-preview.1`, body)).result?.value;
         tl.debug(JSON.stringify(results));
         if (results) { 
            console.log('Result:');
            console.table(results, ["name", "success", "customMessage"]);
         }
      }
      else {
         throw 'No branches to delete.'
      }
   }
   catch (error) {
      tl.setResult(tl.TaskResult.Failed, error, true);
   }
}
run();

function getAzureDevOpsVariable(name: string): string {
   const value = tl.getVariable(name) || undefined;
   if (value === undefined) throw Error(`Variable ${name} is empty`);
   return value;
}

function getAzureDevOpsInput(name: string): string {
   const value = tl.getInput(name) || undefined;
   if (value === undefined) throw Error(`Input ${name} is empty`);
   return value;
}