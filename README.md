# Delete Branches that are protected by Policies

## Introduction

This is the silliest piece of sofware that I have written.
Two tips:

- Don’t use gitflow branching strategy. It is 2021!
- Don’t use branches at all, go for trunk based development.

Azure DevOps has a strange behavioral problem when it comes to protected branches. Protected branches cannot be deleted. With protected branches you want to make sure that you can only write to a branch through a pull request.

You can also use this task to delete somebody else his/her branches.

However, enabling a policy prevents you from deleting the branch. Now you can enable the ‘Force push’ permission and then you are able to delete the branch. However, it also enabling editing of a file on that particulair branch in the Azure DevOps UI. The UI seems to force push all the time making it no longer a protected branch. Azure DevOps simply lacks the 'Delete branch' permission.

So it is a matter of choice: If you want to protect your branches with policies for your developers, the developers simply cannot delete that branch anymore.

Take the gitflow branching strategy (you shoudn’t use that in modern development):

We make use of:

- feature branches
- release Branches (protected)
- hotfix Branches (protected)
- the develop branch (protected)
- the main branch (protected)

Flow:

1. A developer creates a new feature branch: 'feature/feature1'
    - This branch is not protected, so a direct push is possible.
2. After feature1 is completed it is pushed onto the develop branch through a pull request.
    - This deletes the feature/feature1 branch. This branch is not protected so it can be deleted.
    - The develop branch is protected, so it can only be altered by a pull request.
3. We want to create a release branch. 'release/releaseA' branch is created from the develop branch
    - release/* has a policy set. We can only change a release branch through a pull request.
    - We deploy to production.
    - release/releaseA is pulled into main and develop.
    - We set an annotated tag on the commit that went to production.
    - release/releaseA branch should be deleted but we can't since it is protected.

With this extension developers can delete protected branches.

## Recommended setup

- As an admin you create a cross-repo policy with wildcards. So you protect:
  - 'main'
  - 'develop'
  - 'release/*'
  - 'hotfix/*'

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
  - It is only possible to delete 'release/*' or 'hotfix/*' branches.

## Arguments

| Name                        | Description                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| repositoryname | The repository name in the teamproject where this pipeline is run |
| branches |  The branches to delete, comma seperated. Needs to be 'release/branchName' or 'hotfix/branchName' |
| PAT | The Personal Access Token of the Developer (needs Code Read & Write scope) |
