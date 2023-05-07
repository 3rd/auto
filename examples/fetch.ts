import "auto/globals";

export default auto({
  id: "fetch",
  title: "Fetch",
  run: async () => {
    const response = await fetch("https://example.com");
    const text = await response.text();
    console.log(text);
  },
});
