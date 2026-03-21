import { AllAppsData, AppDetailsData, AppDetailsVariables, CreateAppData, CreateAppVariables, AddFeatureToAppData, AddFeatureToAppVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAllApps(options?: useDataConnectQueryOptions<AllAppsData>): UseDataConnectQueryResult<AllAppsData, undefined>;
export function useAllApps(dc: DataConnect, options?: useDataConnectQueryOptions<AllAppsData>): UseDataConnectQueryResult<AllAppsData, undefined>;

export function useAppDetails(vars: AppDetailsVariables, options?: useDataConnectQueryOptions<AppDetailsData>): UseDataConnectQueryResult<AppDetailsData, AppDetailsVariables>;
export function useAppDetails(dc: DataConnect, vars: AppDetailsVariables, options?: useDataConnectQueryOptions<AppDetailsData>): UseDataConnectQueryResult<AppDetailsData, AppDetailsVariables>;

export function useCreateApp(options?: useDataConnectMutationOptions<CreateAppData, FirebaseError, CreateAppVariables>): UseDataConnectMutationResult<CreateAppData, CreateAppVariables>;
export function useCreateApp(dc: DataConnect, options?: useDataConnectMutationOptions<CreateAppData, FirebaseError, CreateAppVariables>): UseDataConnectMutationResult<CreateAppData, CreateAppVariables>;

export function useAddFeatureToApp(options?: useDataConnectMutationOptions<AddFeatureToAppData, FirebaseError, AddFeatureToAppVariables>): UseDataConnectMutationResult<AddFeatureToAppData, AddFeatureToAppVariables>;
export function useAddFeatureToApp(dc: DataConnect, options?: useDataConnectMutationOptions<AddFeatureToAppData, FirebaseError, AddFeatureToAppVariables>): UseDataConnectMutationResult<AddFeatureToAppData, AddFeatureToAppVariables>;
