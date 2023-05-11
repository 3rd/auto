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

    const boolean = await prompt.confirm("On-demand boolean prompt");
    console.log("Boolean value:", boolean);

    const number = await prompt.number("On-demand number prompt");
    console.log("Number value:", number);

    const string = await prompt.string("On-demand string prompt");
    console.log("String value:", string);
  },
});
