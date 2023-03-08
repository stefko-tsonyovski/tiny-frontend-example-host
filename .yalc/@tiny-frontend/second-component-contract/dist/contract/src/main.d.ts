import { TinyFrontendServerResponse } from "@tiny-frontend/client/dist/load.server";
import type exportedModule from "../../app/lib/index";
export declare type SecondComponentType = typeof exportedModule;
export declare const loadExampleTinyFrontendServer: (tinyApiEndpoint: string) => Promise<TinyFrontendServerResponse<SecondComponentType>>;
export declare const loadExampleTinyFrontendClient: (tinyApiEndpoint: string) => Promise<SecondComponentType>;
