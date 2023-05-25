import "auto";

export default auto({
  id: "prompts",
  title: "Auto prompts",
  params: {
    boolean: {
      title: "Boolean param",
      type: "boolean",
    },
    number: {
      title: "Number param",
      type: "number",
    },
    string: {
      title: "String param",
      type: "string",
    },
  },
  run: async ({ params }) => {
    console.log("Params:", params);

    const boolean = await prompt.confirm({ message: "On-demand boolean prompt" });
    console.log("Boolean value:", boolean);

    const string = await prompt.input({ message: "On-demand string prompt" });
    console.log("String value:", string);

    const choice = await prompt.select({
      message: "Choose",
      choices: [
        {
          name: "Blue pill",
          value: "blue",
          description: "Take the blue pill",
        },
        {
          name: "Red pill",
          value: "red",
          description: "Take the red pill",
        },
        new prompt.Separator(),
        {
          name: "Green pill",
          value: "green",
          description: "Take the green pill",
        },
      ],
    });
    console.log("Choice:", choice);
  },
});
