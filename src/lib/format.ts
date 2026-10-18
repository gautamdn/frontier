/** Replace every {{name}} placeholder in an assessment prompt with the child's name. */
export function fillName(template: string, name: string): string {
  return template.replace(/\{\{\s*name\s*\}\}/g, name)
}
