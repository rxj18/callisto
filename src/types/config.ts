export interface ICallistoConfig {
  version: string;
  workspaces: IWorkspace[];
  environments: IEnvironment[];
}

export interface IWorkspace {
  id: string;
  name: string;
  collections: ICollection[];
}

export interface ICollection {
  id: string;
  name: string;
  requests: IRequest[];
}

export interface IRequest {
  id: string;
  name: string;
  req_type: string;
  method: string;
  curl: string;
}

export interface IEnvironment {
  id: string;
  name: string;
  variables: IVariable[];
}

export interface IVariable {
  key: string;
  value: string;
}