import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
// import { analyzeCVWithGPT } from './openai'; // Si usás GPT directo en frontend

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extrae el texto de un archivo PDF o DOCX. Si falla con PDF, usa OCR en el backend.
 */
export async function extractTextFromFile(file, forceOcr = false) {
  console.debug("extractTextFromFile: Iniciando extracción de texto del archivo:", file.name, file.type, "Force OCR:", forceOcr);
  try {
    if (file.type === 'application/pdf') {
      if (forceOcr) {
        console.debug("extractTextFromFile: Forzando OCR para PDF:", file.name);
        const ocrText = await extractTextFromPDFWithOCR(file);
        if (!ocrText || (typeof ocrText === 'object' && ocrText.error) || (typeof ocrText === 'string' && ocrText.trim().length < 10)) {
          return {
            error: "ocr_forced_failed",
            message: "La extracción OCR forzada no devolvió texto útil o falló."
          };
        }
        return ocrText;
      }

      console.debug("extractTextFromFile: Extrayendo texto de PDF (intento inicial):", file.name);
      let text = await extractTextFromPDF(file);
      // Si la extracción es vacía o poco texto, intenta OCR
      if (!text || (typeof text === 'object' && text.error) || text.trim().length < 40) {
        console.warn("extractTextFromFile: Falló la extracción de texto del PDF o es muy corto. Probando OCR backend.");
        const ocrText = await extractTextFromPDFWithOCR(file);
        if (!ocrText || (typeof ocrText === 'object' && ocrText.error) || (typeof ocrText === 'string' && ocrText.trim().length < 10)) {
          return {
            error: "extraction_failed",
            message: "No se pudo extraer el texto del PDF. Puede estar protegido, ser solo imágenes o estar dañado."
          };
        }
        return ocrText;
      }
      return text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      return await extractTextFromDOCX(file);
    }
    throw new Error('Formato de archivo no soportado: ' + file.type);
  } catch (error) {
    console.error('Error al extraer texto del archivo:', file.name, error);
    if (error.name === 'PasswordException' || error.message.includes('password') || error.message.includes('protected')) {
      return { error: "pdf_protected", message: "El PDF está protegido por contraseña y no se puede leer." };
    }
    return { error: "extraction_failed", message: error.message };
  }
}

/**
 * Extrae el texto de un archivo PDF (no basado en imagen, sin protección).
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n'; // Añadir salto de línea entre páginas
  }
  console.debug("extractTextFromPDF: Texto extraído del PDF:", fullText.substring(0, 300));
  return fullText;
}

/**
 * Extrae el texto de un archivo DOCX.
 */
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  console.debug("extractTextFromDOCX: Texto extraído del DOCX:", result.value.substring(0, 300));
  return result.value;
}

/**
 * Envía el archivo PDF al backend /api/ocr para que lo procese con Google Vision OCR.
 */
async function extractTextFromPDFWithOCR(file) {
  try {
    console.debug("extractTextFromPDFWithOCR: Enviando archivo al backend OCR:", file);
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    console.debug("extractTextFromPDFWithOCR: Respuesta del backend OCR:", data);
    if (response.ok && data.text && data.text.trim().length > 0) {
      console.debug("extractTextFromPDFWithOCR: Texto extraído por OCR (primeros 300):", data.text.substring(0, 300));
      return data.text;
    } else {
      console.warn("extractTextFromPDFWithOCR: OCR backend no devolvió texto:", data);
      return { error: "ocr_failed", message: data.error || "OCR no devolvió texto." };
    }
  } catch (error) {
    console.error('Error al hacer OCR en el backend:', error);
    return { error: "ocr_backend_error", message: error.message };
  }
}

/**
 * Analiza el CV recibido como string o como resultado de extracción con error.
 */
export async function analyzeCV(textOrExtractionResult) {
  console.debug("analyzeCV: Iniciando análisis del CV...");

  // Si llega un objeto de error de la extracción
  if (typeof textOrExtractionResult === 'object' && textOrExtractionResult !== null && textOrExtractionResult.error) {
    console.warn("analyzeCV: Problema en la extracción de texto:", textOrExtractionResult.error);
    return {
      nombre: '', edad: '', email: '', telefono: '', localidad: '',
      nivel_escolarizacion: '',
      habilidades: { tecnicas: [], blandas: [] },
      resumen: '', experiencia: '',
      textoCompleto: '', // El texto estaría vacío o no disponible
      extractionError: textOrExtractionResult.error,
      extractionMessage: textOrExtractionResult.message
    };
  }

  const text = typeof textOrExtractionResult === 'string' ? textOrExtractionResult : '';

  if (!text || text.trim() === "" || text.trim().length < 50) {
    console.warn("Texto del CV está vacío o es muy corto. Posible PDF de imagen o problema de extracción.");
    return {
      nombre: '', edad: '', email: '', telefono: '', localidad: '',
      nivel_escolarizacion: '',
      habilidades: { tecnicas: [], blandas: [] },
      resumen: '', experiencia: '',
      textoCompleto: text,
      extractionError: "empty_or_image_pdf",
      extractionMessage: "El contenido del CV está vacío o es muy corto, podría ser un PDF basado en imágenes o estar protegido."
    };
  }

  try {
    console.debug("analyzeCV: Texto extraído del CV (primeros 300 caracteres):", text.substring(0, 300));
    // Si querés usar GPT en backend, llamá tu endpoint:
    const response = await fetch('/api/openai/analyzeCv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error desconocido en el servidor');
    }

    const gptAnalysis = await response.json();
    console.debug("analyzeCV: Análisis con GPT exitoso:", gptAnalysis);

    // Validar que los datos requeridos estén presentes
    // Asegurar que habilidades sea un objeto con tecnicas y blandas, y que tecnicas/blandas sean arrays
    const habilidades = {
      tecnicas: Array.isArray(gptAnalysis.habilidades?.tecnicas)
        ? gptAnalysis.habilidades.tecnicas
        : (Array.isArray(gptAnalysis.habilidades) ? gptAnalysis.habilidades : []), // Compatibilidad con array simple
      blandas: Array.isArray(gptAnalysis.habilidades?.blandas)
        ? gptAnalysis.habilidades.blandas
        : [],
    };

    // Verificar si el análisis es "pobre" (campos clave vacíos o con valores por defecto)
    // El email y el teléfono no son críticos para considerar un análisis "no pobre" si el resto de los datos están.
    const isPoorAnalysis = !gptAnalysis.nombre ||
                           !gptAnalysis.resumen ||
                           !gptAnalysis.experiencia ||
                           (habilidades.tecnicas.length === 0 && habilidades.blandas.length === 0);

    return {
      ...gptAnalysis,
      email: gptAnalysis.email || 'No encontrado', // Asegurar "No encontrado" si es null/undefined
      telefono: gptAnalysis.telefono || 'No encontrado', // Asegurar "No encontrado" si es null/undefined
      habilidades: habilidades,
      nivel_escolarizacion: gptAnalysis.nivel_escolarizacion || gptAnalysis.title || "", // Compatibilidad con 'title'
      textoCompleto: text,
      isPoorAnalysis: isPoorAnalysis // Añadir la bandera de análisis pobre
    };
  } catch (error) {
    console.error('Error en el análisis con GPT:', error);
    // Si hay un error en la llamada a GPT, devolver un objeto con valores por defecto
    // y el error de extracción para que el UI pueda mostrar la advertencia.
    return {
      nombre: 'No encontrado', edad: 'No encontrada', email: 'No encontrado', telefono: 'No encontrado', localidad: 'No encontrada',
      nivel_escolarizacion: 'No especificado',
      habilidades: { tecnicas: [], blandas: [] },
      resumen: 'No se pudo generar el resumen con IA. Por favor, revisa el CV.',
      textoCompleto: text,
      extractionError: "gpt_analysis_failed",
      extractionMessage: error.message || "Error al comunicarse con el servicio de análisis de IA."
    };
  }
}

// Las funciones calculateAge, extractExperience y basicAnalyzeCV ya no son necesarias
// si siempre usamos el análisis de GPT y manejamos los fallos de GPT de forma explícita.
// Sin embargo, las mantendré por si se decide reintroducir un fallback local en el futuro.
// Por ahora, no se llamarán desde analyzeCV.

/**
 * Calcula la edad a partir de una cadena de fecha de nacimiento (dd/mm/yyyy o dd-mm-yyyy).
 */
function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birthDateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = birthDateStr.match(birthDateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const birthDate = new Date(year, month - 1, day);
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : null;
  }
  return null;
}

/**
 * Extrae la sección de experiencia del CV.
 */
function extractExperience(text) {
  const sections = text.split(/\n\s*\n/);
  const experienceHeaders = [
    'experiencia', 'experience', 'experiencia profesional',
    'experiencia laboral', 'work experience', 'employment history',
    'trayectoria profesional', 'career history', 'historial laboral'
  ];
  const endExperienceKeywords = [
    'educación', 'education', 'formación', 'formacion academica', 'academic background',
    'habilidades', 'skills', 'competencias', 'conocimientos', 'technical skills',
    'idiomas', 'languages',
    'referencias', 'references',
    'proyectos', 'projects',
    'cursos', 'courses', 'certificaciones', 'certifications',
    'información adicional', 'additional information', 'otros datos', 'personal interests'
  ];
  let experienceSection = '';
  let captureMode = false;
  for (let i = 0; i < sections.length; i++) {
    const currentSectionText = sections[i];
    if (!currentSectionText || currentSectionText.trim() === "") continue;
    const firstLineLower = currentSectionText.split('\n')[0].toLowerCase().trim();
    if (!captureMode) {
      if (experienceHeaders.some(header => firstLineLower.startsWith(header))) {
        captureMode = true;
        experienceSection += currentSectionText + '\n\n';
      }
    } else {
      if (endExperienceKeywords.some(keyword => firstLineLower.startsWith(keyword))) {
        captureMode = false;
        break;
      }
      experienceSection += currentSectionText + '\n\n';
    }
  }
  return experienceSection.trim() || text;
}

/**
 * Análisis básico del CV por expresiones regulares.
 */
function basicAnalyzeCV(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:(?:(?:\+|00)34[-. ]?)?[6789]\d{1,2}[-. ]?\d{2,3}[-. ]?\d{2,3}[-. ]?\d{2,3})|(?:(?:\+|00)[1-9]\d{0,2}[-. ]?)?(?:\(\d{1,4}\)[-. ]?)?\d{2,4}[-. ]?\d{2,4}[-. ]?\d{2,4}/g;
  const ageRegex = /\b(?:edad|age|años)(?:[^0-9\r\n]*?)(\d{1,2})\b/i;
  const birthDateRegex = /(?:fecha de nacimiento|birth date|nacimiento|fec\. nac\.)(?:[^0-9\r\n]*?)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i;
  const nameRegexFirstPass = /^(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/;
  const nameRegexLabeled = /(?:nombre y apellidos|nombre completo|nombre|name)[:\s]+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/i;
  const locationRegex = /(?:dirección|localidad|ubicación|ciudad|city|location|residencia)[:\s]+([A-ZÁ-Úa-zá-úÑñ\s,0-9\-\(\)\.]+)(?:\r|\n|$)/i;

  const emails = text.match(emailRegex) || [];
  const phones = [...new Set(text.match(phoneRegex) || [])];

  let nombre = 'No encontrado';
  let nameMatch = text.match(nameRegexLabeled);
  if (nameMatch && nameMatch[1]) {
    nombre = nameMatch[1].trim();
  } else {
    nameMatch = text.match(nameRegexFirstPass);
    if (nameMatch && nameMatch[0]) {
      nombre = nameMatch[0].trim();
    }
  }

  const ageMatch = text.match(ageRegex);
  const birthDateMatch = text.match(birthDateRegex);
  let age = 'No encontrada';
  if (ageMatch && ageMatch[1]) {
    age = ageMatch[1];
  } else if (birthDateMatch && birthDateMatch[1]) {
    const calculatedAge = calculateAge(birthDateMatch[1]);
    if (calculatedAge !== null) {
      age = calculatedAge;
    }
  }

  const locationMatch = text.match(locationRegex);

  const skillsSectionRegex = /(?:habilidades|skills|competencias(?: técnicas)?|conocimientos(?: técnicos)?|aptitudes|technical skills|software|herramientas|tecnologías)(?:[^a-zA-Z0-9\r\n]*?)[\s:]*\n?((?:(?:[-•* ]*[^\n]+)\n?)+)/i;
  let skills = [];
  const skillsMatch = text.match(skillsSectionRegex);
  if (skillsMatch && skillsMatch[1]) {
    skills = skillsMatch[1]
      .split(/[\n,;•*-]+/)
      .map(s => s.trim())
      .filter(s => s && s.length > 1 && s.length < 70 && !/^\d+$/.test(s));
  }
  skills = [...new Set(skills)];

  const experiencia = extractExperience(text);

  return {
    nombre: nombre,
    edad: age,
    email: emails[0] || 'No encontrado',
    telefono: phones[0] || 'No encontrado',
    localidad: locationMatch && locationMatch[1] ? locationMatch[1].trim() : 'No encontrada',
    experiencia: experiencia,
    habilidades: { tecnicas: skills.length > 0 ? skills : [], blandas: [] }, // Asegurar que habilidades sea un objeto con tecnicas y blandas
    resumen: 'Análisis básico, resumen no generado.',
    textoCompleto: text
  };
}
