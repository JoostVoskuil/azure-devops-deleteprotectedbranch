export interface IGitRepositoriesResponse {
    count: number;
    value: IGitRepository[]
}
export interface IPermissionResonse {
    count: number;
    value: boolean[]
}

export interface IGitBranchesResponse {
    count: number;
    value: IGitBranch[]
}

export interface IGitRepository {
    id: string;
    name: string;
    isDisabled: boolean;
    defaultBranch: string
}

export interface IGitBranch {
    name: string;
    objectId: string;
}

export interface IGitRefUpdateResultResponse {
    count: number;
    value: IGitRefUpdateResult[]
}
export interface IGitRefUpdateResult {
    customMessage: string;
    name: string;
    success: boolean;
}

export interface IGitRefUpdate {
    name: string;
    oldObjectId: string;
    newObjectId: string;
}