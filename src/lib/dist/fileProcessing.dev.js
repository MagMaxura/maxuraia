"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractTextFromFile = extractTextFromFile;
exports.analyzeCV = analyzeCV;

var pdfjsLib = _interopRequireWildcard(require("pdfjs-dist"));

var _mammoth = _interopRequireDefault(require("mammoth"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// import { analyzeCVWithGPT } from './openai'; // Si usás GPT directo en frontend
pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/".concat(pdfjsLib.version, "/pdf.worker.min.js");
/**
 * Extrae el texto de un archivo PDF o DOCX. Si falla con PDF, usa OCR en el backend.
 */

function extractTextFromFile(file) {
  var text, ocrText;
  return regeneratorRuntime.async(function extractTextFromFile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log("extractTextFromFile: Iniciando extracción de texto del archivo:", file.name, file.type);
          _context.prev = 1;

          if (!(file.type === 'application/pdf')) {
            _context.next = 18;
            break;
          }

          console.log("extractTextFromFile: Extrayendo texto de PDF:", file.name);
          _context.next = 6;
          return regeneratorRuntime.awrap(extractTextFromPDF(file));

        case 6:
          text = _context.sent;

          if (!(!text || _typeof(text) === 'object' && text.error || text.trim().length < 40)) {
            _context.next = 15;
            break;
          }

          console.warn("extractTextFromFile: Falló la extracción de texto del PDF o es muy corto. Probando OCR backend."); // Envía el archivo al endpoint OCR backend

          _context.next = 11;
          return regeneratorRuntime.awrap(extractTextFromPDFWithOCR(file));

        case 11:
          ocrText = _context.sent;

          if (!(!ocrText || _typeof(ocrText) === 'object' && ocrText.error || typeof ocrText === 'string' && ocrText.trim().length < 10)) {
            _context.next = 14;
            break;
          }

          return _context.abrupt("return", {
            error: "extraction_failed",
            message: "No se pudo extraer el texto del PDF. Puede estar protegido, ser solo imágenes o estar dañado."
          });

        case 14:
          return _context.abrupt("return", ocrText);

        case 15:
          return _context.abrupt("return", text);

        case 18:
          if (!(file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword')) {
            _context.next = 22;
            break;
          }

          _context.next = 21;
          return regeneratorRuntime.awrap(extractTextFromDOCX(file));

        case 21:
          return _context.abrupt("return", _context.sent);

        case 22:
          throw new Error('Formato de archivo no soportado: ' + file.type);

        case 25:
          _context.prev = 25;
          _context.t0 = _context["catch"](1);
          console.error('Error al extraer texto del archivo:', file.name, _context.t0);

          if (!(_context.t0.name === 'PasswordException' || _context.t0.message.includes('password') || _context.t0.message.includes('protected'))) {
            _context.next = 30;
            break;
          }

          return _context.abrupt("return", {
            error: "pdf_protected",
            message: "El PDF está protegido por contraseña y no se puede leer."
          });

        case 30:
          return _context.abrupt("return", {
            error: "extraction_failed",
            message: _context.t0.message
          });

        case 31:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 25]]);
}
/**
 * Extrae el texto de un archivo PDF (no basado en imagen, sin protección).
 */


function extractTextFromPDF(file) {
  var arrayBuffer, pdf, fullText, i, page, textContent, pageText;
  return regeneratorRuntime.async(function extractTextFromPDF$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(file.arrayBuffer());

        case 2:
          arrayBuffer = _context2.sent;
          _context2.next = 5;
          return regeneratorRuntime.awrap(pdfjsLib.getDocument({
            data: arrayBuffer
          }).promise);

        case 5:
          pdf = _context2.sent;
          fullText = '';
          i = 1;

        case 8:
          if (!(i <= pdf.numPages)) {
            _context2.next = 20;
            break;
          }

          _context2.next = 11;
          return regeneratorRuntime.awrap(pdf.getPage(i));

        case 11:
          page = _context2.sent;
          _context2.next = 14;
          return regeneratorRuntime.awrap(page.getTextContent());

        case 14:
          textContent = _context2.sent;
          pageText = textContent.items.map(function (item) {
            return item.str;
          }).join(' ');
          fullText += pageText + '\n'; // Añadir salto de línea entre páginas

        case 17:
          i++;
          _context2.next = 8;
          break;

        case 20:
          console.log("extractTextFromPDF: Texto extraído del PDF:", fullText.substring(0, 300));
          return _context2.abrupt("return", fullText);

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  });
}
/**
 * Extrae el texto de un archivo DOCX.
 */


function extractTextFromDOCX(file) {
  var arrayBuffer, result;
  return regeneratorRuntime.async(function extractTextFromDOCX$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(file.arrayBuffer());

        case 2:
          arrayBuffer = _context3.sent;
          _context3.next = 5;
          return regeneratorRuntime.awrap(_mammoth["default"].extractRawText({
            arrayBuffer: arrayBuffer
          }));

        case 5:
          result = _context3.sent;
          console.log("extractTextFromDOCX: Texto extraído del DOCX:", result.value.substring(0, 300));
          return _context3.abrupt("return", result.value);

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  });
}
/**
 * Envía el archivo PDF al backend /api/ocr para que lo procese con Google Vision OCR.
 */


function extractTextFromPDFWithOCR(file) {
  var formData, response, data;
  return regeneratorRuntime.async(function extractTextFromPDFWithOCR$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          console.log("extractTextFromPDFWithOCR: Enviando archivo al backend OCR:", file);
          formData = new FormData();
          formData.append('file', file);
          _context4.next = 6;
          return regeneratorRuntime.awrap(fetch('/api/ocr', {
            method: 'POST',
            body: formData
          }));

        case 6:
          response = _context4.sent;
          _context4.next = 9;
          return regeneratorRuntime.awrap(response.json());

        case 9:
          data = _context4.sent;
          console.log("extractTextFromPDFWithOCR: Respuesta del backend OCR:", data);

          if (!(response.ok && data.text && data.text.trim().length > 0)) {
            _context4.next = 16;
            break;
          }

          console.log("extractTextFromPDFWithOCR: Texto extraído por OCR (primeros 300):", data.text.substring(0, 300));
          return _context4.abrupt("return", data.text);

        case 16:
          console.warn("extractTextFromPDFWithOCR: OCR backend no devolvió texto:", data);
          return _context4.abrupt("return", {
            error: "ocr_failed",
            message: data.error || "OCR no devolvió texto."
          });

        case 18:
          _context4.next = 24;
          break;

        case 20:
          _context4.prev = 20;
          _context4.t0 = _context4["catch"](0);
          console.error('Error al hacer OCR en el backend:', _context4.t0);
          return _context4.abrupt("return", {
            error: "ocr_backend_error",
            message: _context4.t0.message
          });

        case 24:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 20]]);
}
/**
 * Analiza el CV recibido como string o como resultado de extracción con error.
 */


function analyzeCV(textOrExtractionResult) {
  var text, response, error, gptAnalysis;
  return regeneratorRuntime.async(function analyzeCV$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          console.log("analyzeCV: Iniciando análisis del CV..."); // Si llega un objeto de error de la extracción

          if (!(_typeof(textOrExtractionResult) === 'object' && textOrExtractionResult !== null && textOrExtractionResult.error)) {
            _context5.next = 4;
            break;
          }

          console.warn("analyzeCV: Problema en la extracción de texto:", textOrExtractionResult.error);
          return _context5.abrupt("return", {
            nombre: '',
            edad: '',
            email: '',
            telefono: '',
            localidad: '',
            nivel_escolarizacion: '',
            habilidades: {
              tecnicas: [],
              blandas: []
            },
            resumen: '',
            experiencia: '',
            textoCompleto: '',
            // El texto estaría vacío o no disponible
            extractionError: textOrExtractionResult.error,
            extractionMessage: textOrExtractionResult.message
          });

        case 4:
          text = typeof textOrExtractionResult === 'string' ? textOrExtractionResult : '';

          if (!(!text || text.trim() === "" || text.trim().length < 50)) {
            _context5.next = 8;
            break;
          }

          console.warn("Texto del CV está vacío o es muy corto. Posible PDF de imagen o problema de extracción.");
          return _context5.abrupt("return", {
            nombre: '',
            edad: '',
            email: '',
            telefono: '',
            localidad: '',
            nivel_escolarizacion: '',
            habilidades: {
              tecnicas: [],
              blandas: []
            },
            resumen: '',
            experiencia: '',
            textoCompleto: text,
            extractionError: "empty_or_image_pdf",
            extractionMessage: "El contenido del CV está vacío o es muy corto, podría ser un PDF basado en imágenes o estar protegido."
          });

        case 8:
          _context5.prev = 8;
          console.log("analyzeCV: Texto extraído del CV (primeros 300 caracteres):", text.substring(0, 300)); // Si querés usar GPT en backend, llamá tu endpoint:

          _context5.next = 12;
          return regeneratorRuntime.awrap(fetch('/api/openai/analyzeCv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: text
            })
          }));

        case 12:
          response = _context5.sent;

          if (response.ok) {
            _context5.next = 18;
            break;
          }

          _context5.next = 16;
          return regeneratorRuntime.awrap(response.json());

        case 16:
          error = _context5.sent;
          throw new Error(error.error || 'Error desconocido en el servidor');

        case 18:
          _context5.next = 20;
          return regeneratorRuntime.awrap(response.json());

        case 20:
          gptAnalysis = _context5.sent;
          console.log("analyzeCV: Análisis con GPT exitoso:", gptAnalysis); // Validar que los datos requeridos estén presentes

          if (!(!gptAnalysis.nombre || !gptAnalysis.email || !gptAnalysis.telefono)) {
            _context5.next = 25;
            break;
          }

          console.warn("analyzeCV: Faltan datos requeridos en el análisis de GPT:", gptAnalysis);
          return _context5.abrupt("return", basicAnalyzeCV(text));

        case 25:
          return _context5.abrupt("return", _objectSpread({}, gptAnalysis, {
            textoCompleto: text
          }));

        case 28:
          _context5.prev = 28;
          _context5.t0 = _context5["catch"](8);
          console.error('Error en el análisis con GPT:', _context5.t0);
          return _context5.abrupt("return", basicAnalyzeCV(text));

        case 32:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[8, 28]]);
}
/**
 * Calcula la edad a partir de una cadena de fecha de nacimiento (dd/mm/yyyy o dd-mm-yyyy).
 */


function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  var birthDateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  var match = birthDateStr.match(birthDateRegex);

  if (match) {
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    var birthDate = new Date(year, month - 1, day);

    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return null;
    }

    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
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
  var sections = text.split(/\n\s*\n/);
  var experienceHeaders = ['experiencia', 'experience', 'experiencia profesional', 'experiencia laboral', 'work experience', 'employment history', 'trayectoria profesional', 'career history', 'historial laboral'];
  var endExperienceKeywords = ['educación', 'education', 'formación', 'formacion academica', 'academic background', 'habilidades', 'skills', 'competencias', 'conocimientos', 'technical skills', 'idiomas', 'languages', 'referencias', 'references', 'proyectos', 'projects', 'cursos', 'courses', 'certificaciones', 'certifications', 'información adicional', 'additional information', 'otros datos', 'personal interests'];
  var experienceSection = '';
  var captureMode = false;

  var _loop2 = function _loop2(i) {
    var currentSectionText = sections[i];
    if (!currentSectionText || currentSectionText.trim() === "") return "continue";
    var firstLineLower = currentSectionText.split('\n')[0].toLowerCase().trim();

    if (!captureMode) {
      if (experienceHeaders.some(function (header) {
        return firstLineLower.startsWith(header);
      })) {
        captureMode = true;
        experienceSection += currentSectionText + '\n\n';
      }
    } else {
      if (endExperienceKeywords.some(function (keyword) {
        return firstLineLower.startsWith(keyword);
      })) {
        captureMode = false;
        return "break";
      }

      experienceSection += currentSectionText + '\n\n';
    }
  };

  _loop: for (var i = 0; i < sections.length; i++) {
    var _ret = _loop2(i);

    switch (_ret) {
      case "continue":
        continue;

      case "break":
        break _loop;
    }
  }

  return experienceSection.trim() || text;
}
/**
 * Análisis básico del CV por expresiones regulares.
 */


function basicAnalyzeCV(text) {
  var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  var phoneRegex = /(?:(?:(?:\+|00)34[-. ]?)?[6789]\d{1,2}[-. ]?\d{2,3}[-. ]?\d{2,3}[-. ]?\d{2,3})|(?:(?:\+|00)[1-9]\d{0,2}[-. ]?)?(?:\(\d{1,4}\)[-. ]?)?\d{2,4}[-. ]?\d{2,4}[-. ]?\d{2,4}/g;
  var ageRegex = /\b(?:edad|age|años)(?:[^0-9\r\n]*?)(\d{1,2})\b/i;
  var birthDateRegex = /(?:fecha de nacimiento|birth date|nacimiento|fec\. nac\.)(?:[^0-9\r\n]*?)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i;
  var nameRegexFirstPass = /^(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/;
  var nameRegexLabeled = /(?:nombre y apellidos|nombre completo|nombre|name)[:\s]+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3})/i;
  var locationRegex = /(?:dirección|localidad|ubicación|ciudad|city|location|residencia)[:\s]+([A-ZÁ-Úa-zá-úÑñ\s,0-9\-\(\)\.]+)(?:\r|\n|$)/i;
  var emails = text.match(emailRegex) || [];

  var phones = _toConsumableArray(new Set(text.match(phoneRegex) || []));

  var nombre = 'No encontrado';
  var nameMatch = text.match(nameRegexLabeled);

  if (nameMatch && nameMatch[1]) {
    nombre = nameMatch[1].trim();
  } else {
    nameMatch = text.match(nameRegexFirstPass);

    if (nameMatch && nameMatch[0]) {
      nombre = nameMatch[0].trim();
    }
  }

  var ageMatch = text.match(ageRegex);
  var birthDateMatch = text.match(birthDateRegex);
  var age = 'No encontrada';

  if (ageMatch && ageMatch[1]) {
    age = ageMatch[1];
  } else if (birthDateMatch && birthDateMatch[1]) {
    var calculatedAge = calculateAge(birthDateMatch[1]);

    if (calculatedAge !== null) {
      age = calculatedAge;
    }
  }

  var locationMatch = text.match(locationRegex);
  var skillsSectionRegex = /(?:habilidades|skills|competencias(?: técnicas)?|conocimientos(?: técnicos)?|aptitudes|technical skills|software|herramientas|tecnologías)(?:[^a-zA-Z0-9\r\n]*?)[\s:]*\n?((?:(?:[-•* ]*[^\n]+)\n?)+)/i;
  var skills = [];
  var skillsMatch = text.match(skillsSectionRegex);

  if (skillsMatch && skillsMatch[1]) {
    skills = skillsMatch[1].split(/[\n,;•*-]+/).map(function (s) {
      return s.trim();
    }).filter(function (s) {
      return s && s.length > 1 && s.length < 70 && !/^\d+$/.test(s);
    });
  }

  skills = _toConsumableArray(new Set(skills));
  var experiencia = extractExperience(text);
  return {
    nombre: nombre,
    edad: age,
    email: emails[0] || 'No encontrado',
    telefono: phones[0] || 'No encontrado',
    localidad: locationMatch && locationMatch[1] ? locationMatch[1].trim() : 'No encontrada',
    experiencia: experiencia,
    habilidades: {
      tecnicas: skills.length > 0 ? skills : [],
      blandas: []
    },
    // Asegurar que habilidades sea un objeto con tecnicas y blandas
    resumen: 'Análisis básico, resumen no generado.',
    textoCompleto: text
  };
}