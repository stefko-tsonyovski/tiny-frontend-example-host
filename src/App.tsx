import {
  ExampleTinyFrontendType,
  loadExampleTinyFrontendClient,
} from "@tiny-frontend/example-tiny-frontend-contract";
import {
  SecondComponentType,
  loadExampleTinyFrontendClient as loadSecondComponent,
} from "@tiny-frontend/second-component-contract";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [ExampleTinyFrontend, setExampleTinyFrontend] =
    useState<ExampleTinyFrontendType>();

  const [SecondComponent, setSecondComponent] = useState<SecondComponentType>();

  const [counter, setCounter] = useState(0);
  const [secondCounter, setSecondCounter] = useState(0);

  const loadTinyFrontend = async () => {
    const ExampleTinyFrontend = await loadExampleTinyFrontendClient(
      "https://tiny-frontent-api-cloudlare-example.stefko-tsonyovski.workers.dev/api"
    );

    const SecondComponent = await loadSecondComponent(
      "https://tiny-frontent-api-cloudlare-example.stefko-tsonyovski.workers.dev/api"
    );

    setExampleTinyFrontend(() => ExampleTinyFrontend);
    setSecondComponent(() => SecondComponent);
  };

  useEffect(() => {
    loadTinyFrontend();
  }, []);

  return (
    <div className="App">
      {ExampleTinyFrontend ? (
        <ExampleTinyFrontend name="First" onCounterChange={setCounter} />
      ) : (
        <strong>Loading...</strong>
      )}
      <p>
        You have pressed the button inside the first component{" "}
        <strong>{counter} times</strong>.
      </p>
      {SecondComponent ? (
        <SecondComponent
          name="Second"
          age={19}
          onCounterChange={setSecondCounter}
        />
      ) : (
        <strong>Loading...</strong>
      )}
      <p>
        You have pressed the button inside the second component{" "}
        <strong>{secondCounter} times</strong>.
      </p>
    </div>
  );
}

export default App;
