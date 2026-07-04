/// <reference types="vite/client" />

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "react-grid-layout/css/styles.css" {
  const content: string;
  export default content;
}

declare module "react-resizable/css/styles.css" {
  const content: string;
  export default content;
}
