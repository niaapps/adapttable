/** Showcase fixtures import application-owned styles without a Vite dependency. */
declare module "*.css" {
  const stylesheet: string;
  export default stylesheet;
}
