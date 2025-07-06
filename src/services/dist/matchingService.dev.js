"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processJobMatches = processJobMatches;

var _supabase = require("../lib/supabase");

var _plans = require("../config/plans");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Importar la función para calcular límites

/**
 * Procesa y guarda las coincidencias entre candidatos seleccionados (o todos) y un puesto de trabajo específico,
 * llamando a una API de backend para la comparación con OpenAI.
 *
 * @param {string} jobId El UUID del puesto de trabajo a procesar.
 * @param {string} recruiterId El UUID del reclutador que inicia el proceso.
 * @param {string[]} [candidateIds] Un array opcional de UUIDs de candidatos a procesar. Si no se provee, se procesarán todos los candidatos.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de los resultados (nuevos o existentes) de la tabla 'matches'.
 * @throws {Error} Si el puesto de trabajo no se encuentra, si el reclutador no tiene suscripción activa o si se excede el límite de macheos.
 */
function processJobMatches(jobId, recruiterId) {
  var candidateIds,
      _ref,
      subscriptionData,
      subscriptionError,
      effectiveLimits,
      currentMatchCount,
      matchLimit,
      _ref2,
      jobData,
      jobError,
      candidatesQuery,
      _ref3,
      candidates,
      candidatesError,
      allResults,
      matchesProcessedInThisRun,
      _iteratorNormalCompletion,
      _didIteratorError,
      _iteratorError,
      _iterator,
      _step,
      candidate,
      _ref5,
      existingMatch,
      existingMatchError,
      recommendation,
      cvTextContent,
      rawCvContent,
      cvDataForAPI,
      jobDataForAPI,
      comparisonResult,
      response,
      errorData,
      decision_text_part,
      reasoning_text_part,
      summary_text_part,
      parts,
      analysisText,
      _ref6,
      savedMatch,
      saveError,
      _ref4,
      updateSubscriptionError,
      _args = arguments;

  return regeneratorRuntime.async(function processJobMatches$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          candidateIds = _args.length > 2 && _args[2] !== undefined ? _args[2] : [];

          if (jobId) {
            _context.next = 4;
            break;
          }

          console.error("Error: Se requiere un ID de puesto de trabajo (jobId).");
          throw new Error("Se requiere un ID de puesto de trabajo (jobId).");

        case 4:
          if (recruiterId) {
            _context.next = 7;
            break;
          }

          console.error("Error: Se requiere un ID de reclutador (recruiterId).");
          throw new Error("Se requiere un ID de reclutador (recruiterId).");

        case 7:
          if (!(candidateIds && !Array.isArray(candidateIds))) {
            _context.next = 10;
            break;
          }

          console.error("Error: candidateIds debe ser un array.");
          throw new Error("candidateIds debe ser un array.");

        case 10:
          _context.next = 12;
          return regeneratorRuntime.awrap(_supabase.supabase.from('suscripciones').select('*').eq('user_id', recruiterId).single());

        case 12:
          _ref = _context.sent;
          subscriptionData = _ref.data;
          subscriptionError = _ref.error;

          if (!(subscriptionError || !subscriptionData)) {
            _context.next = 18;
            break;
          }

          console.error("Error al obtener la suscripci\xF3n para el reclutador ".concat(recruiterId, ":"), subscriptionError);
          throw new Error("No se pudo obtener la información de la suscripción del usuario.");

        case 18:
          effectiveLimits = (0, _plans.calculateEffectivePlan)(subscriptionData);

          if (effectiveLimits.isSubscriptionActive) {
            _context.next = 21;
            break;
          }

          throw new Error("Su suscripción no está activa. Por favor, active su plan para realizar macheos.");

        case 21:
          currentMatchCount = subscriptionData.mach_analizados_este_periodo || 0;
          matchLimit = effectiveLimits.matchLimit;

          if (!(matchLimit !== Infinity && currentMatchCount >= matchLimit)) {
            _context.next = 25;
            break;
          }

          throw new Error("Ha alcanzado su l\xEDmite de ".concat(matchLimit, " macheos para este per\xEDodo. Por favor, actualice su plan."));

        case 25:
          _context.next = 27;
          return regeneratorRuntime.awrap(_supabase.supabase.from('jobs').select('id, title, description, requirements, keywords').eq('id', jobId).single());

        case 27:
          _ref2 = _context.sent;
          jobData = _ref2.data;
          jobError = _ref2.error;

          if (!(jobError || !jobData)) {
            _context.next = 33;
            break;
          }

          console.error("Error al obtener el puesto de trabajo ".concat(jobId, ":"), jobError);
          throw new Error("Puesto de trabajo con ID ".concat(jobId, " no encontrado o error al obtenerlo."));

        case 33:
          // 3. Obtener los candidatos a procesar.
          candidatesQuery = _supabase.supabase.from('candidatos').select("\n      id,\n      name,\n      title,\n      summary,\n      skills,\n      experience,\n      cvs (\n        content,\n        file_name,\n        created_at\n      )\n    ");

          if (candidateIds && candidateIds.length > 0) {
            candidatesQuery = candidatesQuery["in"]('id', candidateIds);
          }

          _context.next = 37;
          return regeneratorRuntime.awrap(candidatesQuery);

        case 37:
          _ref3 = _context.sent;
          candidates = _ref3.data;
          candidatesError = _ref3.error;

          if (!candidatesError) {
            _context.next = 43;
            break;
          }

          console.error("Error al obtener candidatos:", candidatesError);
          throw new Error("Error al obtener la lista de candidatos.");

        case 43:
          if (!(!candidates || candidates.length === 0)) {
            _context.next = 46;
            break;
          }

          console.log("No se encontraron candidatos para procesar con los IDs proporcionados o no hay candidatos.");
          return _context.abrupt("return", []);

        case 46:
          allResults = [];
          matchesProcessedInThisRun = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 51;
          _iterator = candidates[Symbol.iterator]();

        case 53:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 125;
            break;
          }

          candidate = _step.value;
          _context.next = 57;
          return regeneratorRuntime.awrap(_supabase.supabase.from('matches').select('*').eq('job_id', jobId).eq('candidato_id', candidate.id).maybeSingle());

        case 57:
          _ref5 = _context.sent;
          existingMatch = _ref5.data;
          existingMatchError = _ref5.error;

          if (existingMatchError) {
            console.error("Error al verificar match existente para candidato ".concat(candidate.id, " y job ").concat(jobId, ":"), existingMatchError);
          }

          if (!existingMatch) {
            _context.next = 66;
            break;
          }

          console.log("Match ya existente para candidato ".concat(candidate.id, " y job ").concat(jobId, ". Score: ").concat(existingMatch.match_score, ". Omitiendo re-an\xE1lisis."));
          recommendation = existingMatch.analysis && existingMatch.analysis.toLowerCase().includes("recomendación: sí");
          allResults.push(_objectSpread({}, existingMatch, {
            recommendation: recommendation,
            alreadyExisted: true,
            error: false
          }));
          return _context.abrupt("continue", 122);

        case 66:
          if (!(matchLimit !== Infinity && currentMatchCount + matchesProcessedInThisRun >= matchLimit)) {
            _context.next = 70;
            break;
          }

          console.warn("L\xEDmite de macheos alcanzado para el reclutador ".concat(recruiterId, ". Se detiene el procesamiento."));
          allResults.push({
            job_id: jobId,
            candidato_id: candidate.id,
            match_score: 0,
            analysis: "L\xEDmite de macheos alcanzado para este per\xEDodo.",
            recommendation: false,
            error: true,
            limitReached: true
          });
          return _context.abrupt("continue", 122);

        case 70:
          cvTextContent = 'No disponible';

          if (candidate.cvs && candidate.cvs.length > 0) {
            rawCvContent = candidate.cvs[0].content;

            if (_typeof(rawCvContent) === 'object' && rawCvContent !== null) {
              cvTextContent = JSON.stringify(rawCvContent);
            } else if (typeof rawCvContent === 'string') {
              cvTextContent = rawCvContent;
            }
          }

          cvDataForAPI = {
            name: candidate.name,
            title: candidate.title,
            summary: candidate.summary,
            skills: candidate.skills,
            experience: candidate.experience,
            cv_content: cvTextContent
          };
          jobDataForAPI = {
            title: jobData.title,
            description: jobData.description,
            requirements: jobData.requirements,
            keywords: jobData.keywords
          };
          console.log("Comparando CV de ".concat(candidate.name, " (").concat(candidate.id, ") con el puesto ").concat(jobData.title, " (").concat(jobId, ")..."));
          comparisonResult = void 0;
          _context.prev = 76;
          _context.next = 79;
          return regeneratorRuntime.awrap(fetch('/api/openai/compareCv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              cvData: cvDataForAPI,
              jobData: jobDataForAPI
            })
          }));

        case 79:
          response = _context.sent;

          if (response.ok) {
            _context.next = 97;
            break;
          }

          errorData = void 0;
          _context.prev = 82;
          _context.next = 85;
          return regeneratorRuntime.awrap(response.json());

        case 85:
          errorData = _context.sent;
          _context.next = 95;
          break;

        case 88:
          _context.prev = 88;
          _context.t0 = _context["catch"](82);
          _context.t1 = "Error del servidor: ".concat(response.status, " - ").concat(response.statusText);
          _context.next = 93;
          return regeneratorRuntime.awrap(response.text());

        case 93:
          _context.t2 = _context.sent;
          errorData = {
            error: _context.t1,
            details: _context.t2
          };

        case 95:
          console.error("Error data from API:", errorData);
          throw new Error(errorData.error || errorData.details || "Error del servidor: ".concat(response.status));

        case 97:
          _context.next = 99;
          return regeneratorRuntime.awrap(response.json());

        case 99:
          comparisonResult = _context.sent;
          console.log("[matchingService] comparisonResult desde API para candidato ".concat(candidate.id, ":"), comparisonResult);
          _context.next = 108;
          break;

        case 103:
          _context.prev = 103;
          _context.t3 = _context["catch"](76);
          console.error("Error al llamar a la API /api/openai/compareCv o procesar su respuesta para candidato ".concat(candidate.id, ":"), _context.t3);
          allResults.push({
            job_id: jobId,
            candidato_id: candidate.id,
            match_score: 0,
            analysis: "Error en la comunicaci\xF3n con el servicio de comparaci\xF3n: ".concat(_context.t3.message),
            recommendation: false,
            error: true
          });
          return _context.abrupt("continue", 122);

        case 108:
          decision_text_part = "Decisi\xF3n de Recomendaci\xF3n: ".concat(comparisonResult.recommendation_decision || 'N/A');
          reasoning_text_part = comparisonResult.recommendation_reasoning ? "Razonamiento: ".concat(comparisonResult.recommendation_reasoning) : '';
          summary_text_part = comparisonResult.summary ? "Resumen General: ".concat(comparisonResult.summary) : '';
          parts = [decision_text_part];
          if (reasoning_text_part) parts.push(reasoning_text_part);
          if (summary_text_part) parts.push(summary_text_part);
          analysisText = parts.reduce(function (acc, part, index) {
            if (index === 0) return part;
            if (acc.match(/[.!?]$/)) return "".concat(acc, " ").concat(part);
            return "".concat(acc, ". ").concat(part);
          }, '');

          if (analysisText && !analysisText.match(/[.!?]$/)) {
            analysisText += '.';
          }

          _context.next = 118;
          return regeneratorRuntime.awrap(_supabase.supabase.from('matches').insert({
            job_id: jobId,
            candidato_id: candidate.id,
            match_score: comparisonResult.score,
            analysis: analysisText
          }).select().single());

        case 118:
          _ref6 = _context.sent;
          savedMatch = _ref6.data;
          saveError = _ref6.error;

          if (saveError) {
            console.error("Error al guardar el match para candidato ".concat(candidate.id, " y job ").concat(jobId, ":"), saveError);
            allResults.push({
              job_id: jobId,
              candidato_id: candidate.id,
              match_score: comparisonResult.score,
              analysis: analysisText,
              recommendation: comparisonResult.recommendation,
              error: true,
              saveError: saveError.message
            });
          } else {
            console.log("Match guardado para candidato ".concat(candidate.id, " y job ").concat(jobId, ". Score: ").concat(comparisonResult.score));
            allResults.push(_objectSpread({}, savedMatch, {
              summary: comparisonResult.summary,
              recommendation_reasoning: comparisonResult.recommendation_reasoning,
              recommendation_decision: comparisonResult.recommendation_decision,
              recommendation: comparisonResult.recommendation,
              error: false,
              alreadyExisted: false
            }));
            matchesProcessedInThisRun++; // Incrementar el contador solo para nuevos macheos
          }

        case 122:
          _iteratorNormalCompletion = true;
          _context.next = 53;
          break;

        case 125:
          _context.next = 131;
          break;

        case 127:
          _context.prev = 127;
          _context.t4 = _context["catch"](51);
          _didIteratorError = true;
          _iteratorError = _context.t4;

        case 131:
          _context.prev = 131;
          _context.prev = 132;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 134:
          _context.prev = 134;

          if (!_didIteratorError) {
            _context.next = 137;
            break;
          }

          throw _iteratorError;

        case 137:
          return _context.finish(134);

        case 138:
          return _context.finish(131);

        case 139:
          if (!(matchesProcessedInThisRun > 0)) {
            _context.next = 145;
            break;
          }

          _context.next = 142;
          return regeneratorRuntime.awrap(_supabase.supabase.from('suscripciones').update({
            mach_analizados_este_periodo: currentMatchCount + matchesProcessedInThisRun
          }).eq('user_id', recruiterId));

        case 142:
          _ref4 = _context.sent;
          updateSubscriptionError = _ref4.error;

          if (updateSubscriptionError) {
            console.error("Error al actualizar el contador de macheos para el reclutador ".concat(recruiterId, ":"), updateSubscriptionError); // No lanzar error fatal aquí, ya que los macheos ya se guardaron.
          } else {
            console.log("Contador de macheos actualizado para el reclutador ".concat(recruiterId, ". Nuevos macheos: ").concat(matchesProcessedInThisRun, ". Total: ").concat(currentMatchCount + matchesProcessedInThisRun));
          }

        case 145:
          console.log("Proceso de matching completado para el puesto ".concat(jobId, "."));
          allResults.sort(function (a, b) {
            return (b.match_score || 0) - (a.match_score || 0);
          });
          return _context.abrupt("return", allResults);

        case 148:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[51, 127, 131, 139], [76, 103], [82, 88], [132,, 134, 138]]);
}