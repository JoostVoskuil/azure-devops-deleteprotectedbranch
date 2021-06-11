import * as rm from 'typed-rest-client/RestClient';
import * as tl from 'azure-pipelines-task-lib';
import { IHeaders, IProxyConfiguration, IRequestOptions } from 'typed-rest-client/Interfaces';

export class AzureDevOpsConnection {
    private restClient: rm.RestClient;

    /**
     * Private constructpr
     * @param { string } organisationUrl The url of the organisation
     * @param { string } token PAT token
     */
    constructor(organisationUrl: string, token: string, teamProject?: string) {
        if (teamProject) {
            organisationUrl = `${organisationUrl}${teamProject}`;
        }
        const userAgent = 'Azure DevOps';
        const requestHeaders: IHeaders = {};
        requestHeaders['Content-Type'] = 'application/json';
        requestHeaders['Authorization'] = `Basic ${Buffer.from(`PAT:${token}`).toString('base64')}`
        const requestOptions: IRequestOptions = {
            socketTimeout: 100000,
            allowRetries: true,
            maxRetries: 10,
            headers: requestHeaders,
        };

        const agentProxy = tl.getHttpProxyConfiguration();
        let proxyConfiguration: IProxyConfiguration;

        if (agentProxy) {
            proxyConfiguration = {
                proxyUrl: agentProxy.proxyUrl,
            }
            if (agentProxy.proxyUsername) proxyConfiguration.proxyUsername = agentProxy.proxyUsername;
            if (agentProxy.proxyPassword) proxyConfiguration.proxyPassword = agentProxy.proxyPassword;
            if (agentProxy.proxyBypassHosts) proxyConfiguration.proxyBypassHosts = agentProxy.proxyBypassHosts;
            requestOptions.proxy = proxyConfiguration;
        }

        this.restClient = new rm.RestClient(userAgent, organisationUrl, undefined, requestOptions);
    }

    /**
     * Creates a resource
     * @param { string } resource resource Url
     * @param { any } createObject Object to be created
     * @return { rm.IRestResponse<T> } returns the RestResponse
     */
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
    async create<T>(resource: string, createObject: any): Promise<rm.IRestResponse<T>> {
        try {
            tl.debug(`REST POST: ${resource}`);
            const result = await this.restClient.create<T>(resource, createObject);
            return result;
        }
        catch (err: any) {
            throw `Error sending create to ${resource} to Azure DevOps API. Error: ${err.message}`;
        }
    }

    /**
     * Gets a resource
     * @param { string } resource resource Url
     * @return { rm.IRestResponse<T> } returns the RestResponse
     */
    async get<T>(resource: string): Promise<rm.IRestResponse<T>> {
        try {
            tl.debug(`REST GET: ${resource}`);
            const result = await this.restClient.get<T>(resource);
            if (result.result === null) throw new Error("Resource not found");
            return result;
        }
        catch (err: any) {
            throw `Error sending get to ${resource} to Azure DevOps API. Error: ${err.message}`;
        }
    }
}