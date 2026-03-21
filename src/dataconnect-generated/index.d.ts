import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddFeatureToAppData {
  feature_insert: Feature_Key;
}

export interface AddFeatureToAppVariables {
  appId: UUIDString;
  featureName: string;
  featureDescription: string;
}

export interface AllAppsData {
  apps: ({
    id: UUIDString;
    name: string;
    description: string;
  } & App_Key)[];
}

export interface AppAudience_Key {
  appId: UUIDString;
  audienceId: UUIDString;
  __typename?: 'AppAudience_Key';
}

export interface AppDetailsData {
  app?: {
    id: UUIDString;
    name: string;
    description: string;
    features_on_app: ({
      id: UUIDString;
      name: string;
      description: string;
    } & Feature_Key)[];
      audiences_via_AppAudience: ({
        id: UUIDString;
        name: string;
        description: string;
      } & Audience_Key)[];
  } & App_Key;
}

export interface AppDetailsVariables {
  appId: UUIDString;
}

export interface App_Key {
  id: UUIDString;
  __typename?: 'App_Key';
}

export interface Audience_Key {
  id: UUIDString;
  __typename?: 'Audience_Key';
}

export interface CreateAppData {
  app_insert: App_Key;
}

export interface CreateAppVariables {
  name: string;
  description: string;
}

export interface Feature_Key {
  id: UUIDString;
  __typename?: 'Feature_Key';
}

export interface UserInteraction_Key {
  id: UUIDString;
  __typename?: 'UserInteraction_Key';
}

interface AllAppsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AllAppsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AllAppsData, undefined>;
  operationName: string;
}
export const allAppsRef: AllAppsRef;

export function allApps(): QueryPromise<AllAppsData, undefined>;
export function allApps(dc: DataConnect): QueryPromise<AllAppsData, undefined>;

interface AppDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AppDetailsVariables): QueryRef<AppDetailsData, AppDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AppDetailsVariables): QueryRef<AppDetailsData, AppDetailsVariables>;
  operationName: string;
}
export const appDetailsRef: AppDetailsRef;

export function appDetails(vars: AppDetailsVariables): QueryPromise<AppDetailsData, AppDetailsVariables>;
export function appDetails(dc: DataConnect, vars: AppDetailsVariables): QueryPromise<AppDetailsData, AppDetailsVariables>;

interface CreateAppRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAppVariables): MutationRef<CreateAppData, CreateAppVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateAppVariables): MutationRef<CreateAppData, CreateAppVariables>;
  operationName: string;
}
export const createAppRef: CreateAppRef;

export function createApp(vars: CreateAppVariables): MutationPromise<CreateAppData, CreateAppVariables>;
export function createApp(dc: DataConnect, vars: CreateAppVariables): MutationPromise<CreateAppData, CreateAppVariables>;

interface AddFeatureToAppRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFeatureToAppVariables): MutationRef<AddFeatureToAppData, AddFeatureToAppVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddFeatureToAppVariables): MutationRef<AddFeatureToAppData, AddFeatureToAppVariables>;
  operationName: string;
}
export const addFeatureToAppRef: AddFeatureToAppRef;

export function addFeatureToApp(vars: AddFeatureToAppVariables): MutationPromise<AddFeatureToAppData, AddFeatureToAppVariables>;
export function addFeatureToApp(dc: DataConnect, vars: AddFeatureToAppVariables): MutationPromise<AddFeatureToAppData, AddFeatureToAppVariables>;

