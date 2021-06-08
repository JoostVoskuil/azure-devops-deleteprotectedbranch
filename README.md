# Delete Branches that are protected by Policies

## Introduction

This is the silliest piece of sofware that I have written.
Two tips:

- Don’t use gitflow branching strategy. It is 2021!
- Don’t use branches at all, go for trunk based development.

Azure DevOps has a strange behavioral problem when it comes to branches and delete permissions:
- Protected branches cannot be deleted. With protected branches you want to make sure that you can only write to a branch through a pull request.
- Branches that are not yours cannot be deleted. When people leave the organisation old branches remains

Now you can enable the ‘Force push’ permission and then you are able to delete the branch. However, it also enabling editing of a file on that particulair branch in the Azure DevOps UI. The UI seems to force push all the time and it risks that developers are not mergin but just force push. Azure DevOps simply lacks the 'Delete branch' permission.

With this extension developers can delete protected branches and branches that are theirs without having force permissions. It uses the 'Projects Build Service' to delete the branch.

## Recommended setup

- You need to disable setting 'Limit job authorization scope to referenced Azure DevOps repositories' in the Project Pipeline settings. If you don't want this, this task must be run using the target repository as a checkout.

- Set the repository permission on project level that the 'Projects Build Service' are allowed to:
  - 'Contribute'
  - 'Bypass policies when pushing'
  - 'Force push (rewrite history, delete branches and tags)'. Your developers should not have force push permissions.

## Usage

- Developers need 'Create branch' permission for this extension to work.
  - The developer specifies the repostitory name, the branches to delete and the users' PAT token (that needs code read & write permission as scope).
  - The extensio uses the developers' PAT token to check if the developer has 'Create Branch' permission. So it assumes that when you provide the Create Branch Permission it's opposite permission (delete) is allowed.
  - The extension uses the system.accesstoken to delete the protected branch through the build service.

## Arguments

| Name                        | Description                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| repositoryname | The repository name in the teamproject where this pipeline is run |
| onlygitflow | When false, every branch can be deleted. When true only 'release/branchName' or 'hotfix/branchName' branches can be specified |
| branches |  The branches to delete, comma seperated. Needs to be 'release/branchName' or 'hotfix/branchName' |
| PAT | The Personal Access Token of the Developer (needs Code Read & Write scope) |
