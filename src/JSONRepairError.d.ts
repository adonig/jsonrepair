export declare class JSONRepairError {
    name: string;
    message: string;
    stack?: string;
    position: number;
    constructor(message: string, position: number);
}
