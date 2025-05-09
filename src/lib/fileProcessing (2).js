
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromFile(file) {
  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.type === 'application/msword') {
      return await extractTextFromDOCX(file);
    }
    throw new Error('Formato de archivo no soportado');
  } catch (error) {
    console.error('Error al extraer texto:', error);
    throw error;
  }
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export function analyzeCV(text) {
  // Expresiones regulares para extraer información
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+34|0034|34)?[ -]*(6|7)[ -]*([0-9][ -]*){8}/g;
  const ageRegex = /\b(?:edad|age|años)[:\s]+(\d{1,2})\b/i;
  const nameRegex = /(?:nombre|name)[:\s]+([A-ZÁ-Úa-zá-ú\s]+)(?:\r|\n|$)/i;
  const locationRegex = /(?:dirección|location|ciudad|city)[:\s]+([A-ZÁ-Úa-zá-ú\s,]+)(?:\r|\n|$)/i;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const ageMatch = text.match(ageRegex);
  const nameMatch = text.match(nameRegex);
  const locationMatch = text.match(locationRegex);

  // Extraer experiencia (párrafos que contienen palabras clave)
  const experienceKeywords = ['experiencia', 'experience', 'trabajo', 'work', 'empleo', 'employment'];
  const paragraphs = text.split(/\n\n+/);
  const experienceParagraphs = paragraphs.filter(p => 
    experienceKeywords.some(keyword => p.toLowerCase().includes(keyword))
  );

  // Extraer habilidades (palabras después de "habilidades" o "skills")
  const skillsMatch = text.match(/(?:habilidades|skills)[:\s]+([^]*?)(?:\n\n|\n(?=[A-Z])|\n$)/i);
  const skills = skillsMatch ? 
    skillsMatch[1].split(/[,\n]/).map(s => s.trim()).filter(Boolean) : 
    [];

  return {
    nombre: nameMatch ? nameMatch[1].trim() : 'No encontrado',
    edad: ageMatch ? ageMatch[1] : 'No encontrada',
    email: emails[0] || 'No encontrado',
    telefono: phones[0] || 'No encontrado',
    localidad: locationMatch ? locationMatch[1].trim() : 'No encontrada',
    experiencia: experienceParagraphs.join('\n\n'),
    habilidades: skills,
    textoCompleto: text
  };
}
