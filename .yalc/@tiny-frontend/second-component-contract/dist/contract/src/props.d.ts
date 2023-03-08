export interface ExampleTinyFrontendProps {
    name: string;
    onCounterChange?: (counter: number) => void;
}
export declare type SecondComponentProps = {
    age: number;
} & ExampleTinyFrontendProps;
