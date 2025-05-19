import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
//import { analyzeCVWithGPT } from './openai';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromFile(file) {
  console.log("extractTextFromFile: Iniciando extracción de texto del archivo:", file.name, file.type);
  try {
    if (file.type === 'application/pdf') {
      console.log("extractTextFromFile: Extrayendo texto de PDF:", file.name);
      return await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.type === 'application/msword') {
      return await extractTextFromDOCX(file);
    }
    throw new Error('Formato de archivo no soportado: ' + file.type);
  } catch (error) {
    console.error('Error al extraer texto del archivo:', file.name, error);
    // Devolver un objeto de error específico en lugar de lanzar la excepción directamente
    // para que analyzeCV pueda manejarlo.
    if (error.name === 'PasswordException' || error.message.includes('password') || error.message.includes('protected')) {
      return { error: "pdf_protected", message: "El PDF está protegido por contraseña y no se puede leer." };
    }
    // Podríamos añadir más heurísticas para detectar PDFs basados en imágenes si la librería no da error pero devuelve poco texto.
    return { error: "extraction_failed", message: error.message };
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
    fullText += pageText + '\n'; // Añadir salto de línea entre páginas
  }

  console.log("extractTextFromPDF: Texto extraído del PDF:", fullText.substring(0, 300));
  return fullText;
}

async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  console.log("extractTextFromDOCX: Texto extraído del DOCX:", result.value.substring(0, 300));
  return result.value;
}

export async function analyzeCV(textOrExtractionResult) {
  console.log("analyzeCV: Iniciando análisis del CV...");

  // Verificar si textOrExtractionResult es un objeto de error de la extracción
  if (typeof textOrExtractionResult === 'object' && textOrExtractionResult !== null && textOrExtractionResult.error) {
    console.warn("analyzeCV: Problema en la extracción de texto:", textOrExtractionResult.error);
    // Devolver una estructura de análisis que indique el error de extracción
    return {
      nombre: '', edad: '', email: '', telefono: '', localidad: '',
      nivel_escolarizacion: '',
      habilidades: { tecnicas: [], blandas: [] },
      resumen: '', experiencia: '',
      textoCompleto: '', // El texto estaría vacío o no disponible
      extractionError: textOrExtractionResult.error, // 'pdf_protected' o 'extraction_failed'
      extractionMessage: textOrExtractionResult.message
    };
  }

  const text = typeof textOrExtractionResult === 'string' ? textOrExtractionResult : '';

  if (!text || text.trim() === "" || text.trim().length < 50) { // Considerar texto muy corto como posible PDF de imagen
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
    console.log("analyzeCV: Texto extraído del CV (primeros 300 caracteres):", text.substring(0, 300));
    console.log("analyzeCV: Intentando análisis con GPT...");
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
    console.log("analyzeCV: Análisis con GPT exitoso:", gptAnalysis);
    return {
      ...gptAnalysis, // Asume que gptAnalysis ya tiene todos los campos necesarios
      textoCompleto: text
    };
  } catch (error) {
    console.error('Error en el análisis con GPT:', error);
    return {
      nombre: 'No encontrado', edad: null, email: 'No encontrado', telefono: 'No encontrado', localidad: 'No encontrada',
      nivel_escolarizacion: 'No especificado',
      habilidades: { tecnicas: [], blandas: [] },
      resumen: 'Análisis no disponible debido a un error.', experiencia: 'Análisis no disponible debido a un error.',
      textoCompleto: text,
      extractionError: "gpt_analysis_failed",
      extractionMessage: "No se pudo analizar el CV con la IA."
    };
  }
}

function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  // Regex mejorada para dd/mm/yyyy o dd-mm-yyyy
  const birthDateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = birthDateStr.match(birthDateRegex);
  
  if (match) {
    // Asegurar que día, mes y año son interpretados correctamente
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10); // Mes es 1-12
    const year = parseInt(match[3], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const birthDate = new Date(year, month - 1, day); // Mes en Date es 0-11
    // Verificar si la fecha es válida (ej. 30 de febrero)
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
        return null; 
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : null; // Edad no puede ser negativa
  }
  return null;
}

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
  // Si no se encontró nada específico, devolver el texto original como fallback (según preferencia del usuario)
  return experienceSection.trim() || text; 
}

function basicAnalyzeCV(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:(?:(?:\+|00)34[-. ]?)?[6789]\d{1,2}[-. ]?\d{2,3}[-. ]?\d{2,3}[-. ]?\d{2,3})|(?:(?:\+|00)[1-9]\d{0,2}[-. ]?)?(?:\(\d{1,4}\)[-. ]?)?\d{2,4}[-. ]?\d{2,4}[-. ]?\d{2,4}/g;
  const ageRegex = /\b(?:edad|age|años)(?:[^0-9\r\n]*?)(\d{1,2})\b/i;
  const birthDateRegex = /(?:fecha de nacimiento|birth date|nacimiento|fec\. nac\.)(?:[^0-9\r\n]*?)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i;
  const nameRegexFirstPass = /^(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/;
  const nameRegexLabeled = /(?:nombre y apellidos|nombre completo|nombre|name)[:\s]+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/i;
  const locationRegex = /(?:dirección|localidad|ubicación|ciudad|city|location|residencia)[:\s]+([A-ZÁ-Úa-zá-úÑñ\s,0-9\-\(\)\.]+)(?:\r|\n|$)/i;

  const emails = text.match(emailRegex) || [];
  const phones = [...new Set(text.match(phoneRegex) || [])]; // Eliminar duplicados
  
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
      .split(/[\n,;•*-]+/) // Dividir por nueva línea, coma, punto y coma, viñetas
      .map(s => s.trim())
      .filter(s => s && s.length > 1 && s.length < 70 && !/^\d+$/.test(s)); // Filtrar vacíos, muy cortos, muy largos o solo números
  }
  skills = [...new Set(skills)]; // Eliminar duplicados

  const experiencia = extractExperience(text);

  return {
    nombre: nombre,
    edad: age,
    email: emails[0] || 'No encontrado',
    telefono: phones[0] || 'No encontrado',
    localidad: locationMatch && locationMatch[1] ? locationMatch[1].trim() : 'No encontrada',
    experiencia: experiencia,
    habilidades: skills.length > 0 ? skills : ['No encontradas'],
    resumen: 'Análisis básico, resumen no generado.',
    textoCompleto: text
  };
}
