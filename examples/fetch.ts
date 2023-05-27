import "auto";

export default auto({
  id: "fetch",
  title: "Fetch",
  run: async () => {
    const response = await fetch("http://localhost:9123");
    const text = await response.text();
    console.log(text);
  },
});
