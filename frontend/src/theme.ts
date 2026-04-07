import { createTheme } from "@mantine/core";

const inputStyles = {
  input: {
    backgroundColor: "var(--mantine-color-dark-8)",
    borderColor: "var(--mantine-color-dark-6)",
  },
};

export const theme = createTheme({
  primaryColor: "teal",
  fontFamily: "'Roboto', sans-serif",
  defaultRadius: "md",
  colors: {
    dark: [
      "#d5d7e0",
      "#C1C2C5",
      "#909296",
      "#5C5F66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
  },
  headings: {
    fontFamily: "'Roboto', sans-serif",
    fontWeight: "600",
  },
  components: {
    TextInput: { styles: inputStyles },
    PasswordInput: { styles: inputStyles },
    Select: { styles: inputStyles },
    Textarea: { styles: inputStyles },
    NumberInput: { styles: inputStyles },
    FileInput: { styles: inputStyles },
  },
});
