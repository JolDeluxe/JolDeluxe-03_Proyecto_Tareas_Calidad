export const getPublicIdFromCloudinaryUrl = (
  url: string,
  folder: string
): string | null => {
  // Regex para encontrar el patrón: /v[numeros]/[carpeta]/[nombre_archivo]
  const regex = new RegExp(`v\\d+\\/(${folder}\\/[^\\/\\.]+)`);
  
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
};