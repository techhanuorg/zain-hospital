import { PatientEntities, ExtractedEntity, ConfidenceLevel } from '../../types';

export class EntityExtractor {
  /**
   * Fast rule-based + regex entity extractor for Hindi/Hinglish/English
   */
  public static extractFast(text: string): PatientEntities {
    const entities: PatientEntities = {};
    const lower = text.toLowerCase();

    // 1. Extract Age
    // e.g. "age 42", "42 saal", "42 saal ka", "umar 42", "42 years", "42 male"
    const agePatterns = [
      /(?:age|umar|umra|aayu|saal)\s*[:=]?\s*(\d{1,2})/i,
      /(\d{1,2})\s*(?:saal|varsh|years|yrs|y\/o)/i,
      /(\d{1,2})\s*(?:male|female|m|f|purush|mahila)/i,
      /([1-9][0-9])/ // Standalone 2-digit number (10-99)
    ];

    for (const pat of agePatterns) {
      const match = text.match(pat);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 0 && val <= 110) {
          entities.age = {
            value: val,
            confidence: 0.95,
            level: 'HIGH',
            rawText: match[0]
          };
          break;
        }
      }
    }

    // 2. Extract Gender
    if (/(male|purush|aadmi|man|boy|m)/i.test(text) && !/(female|mahila)/i.test(text)) {
      entities.gender = { value: 'Male', confidence: 0.95, level: 'HIGH' };
    } else if (/(female|mahila|aurat|woman|girl|stree|f)/i.test(text)) {
      entities.gender = { value: 'Female', confidence: 0.95, level: 'HIGH' };
    } else if (/(rahi hu|meri mummy|meri behen|meri biwi|mrs|miss|smt)/i.test(text)) {
      entities.gender = { value: 'Female', confidence: 0.85, level: 'HIGH' };
    } else if (/(raha hu|mera bhai|mere papa|mera beta|mr|shri)/i.test(text)) {
      entities.gender = { value: 'Male', confidence: 0.85, level: 'HIGH' };
    }

    // 3. Extract Name
    // "mera naam ramesh", "naam ramesh", "my name is Ramesh", "mai sunita bol rahi", "Ramesh 42 male"
    const namePatterns = [
      /(?:mera naam|my name is|naam|name is|i am|mai|main)\s+([A-Za-zऀ-ॿ]{2,20}(?:\s+[A-Za-zऀ-ॿ]{2,20})?)/i,
      /^([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)\s+\d{1,2}/i
    ];

    for (const pat of namePatterns) {
      const match = text.match(pat);
      if (match) {
        const candidate = match[1].trim();
        const forbidden = ['doctor', 'hospital', 'kal', 'aaj', 'shaam', 'subah', 'appointment', 'cardiology'];
        if (!forbidden.includes(candidate.toLowerCase())) {
          entities.name = {
            value: candidate.charAt(0).toUpperCase() + candidate.slice(1),
            confidence: 0.92,
            level: 'HIGH',
            rawText: match[0]
          };
          break;
        }
      }
    }

    // 4. Extract Doctor Name
    const docMatch = text.match(/(?:dr\.?|doctor)\s+([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)/i);
    const nonDocWords = ['kab', 'kya', 'kaha', 'kaise', 'chahiye', 'batao', 'dikhao', 'available', 'hai', 'hain', 'hoga', 'hogi', 'milenge', 'milte', 'kaun', 'list', 'timing', 'fees', 'ko', 'se', 'ki', 'ka', 'ke'];
    if (docMatch) {
      const candidateDoc = docMatch[1].trim();
      const words = candidateDoc.toLowerCase().split(/\s+/);
      const isInvalid = words.some(w => nonDocWords.includes(w));
      if (!isInvalid && candidateDoc.length > 2) {
        entities.doctorName = {
          value: `Dr. ${candidateDoc}`,
          confidence: 0.90,
          level: 'HIGH',
          rawText: docMatch[0]
        };
      }
    }
    
    if (!entities.doctorName && /\b(sharma|verma|gupta|mehta|kapoor|singh|rao|khan|tripathi)\b/i.test(text)) {
      const surname = text.match(/\b(sharma|verma|gupta|mehta|kapoor|singh|rao|khan|tripathi)\b/i)![0];
      entities.doctorName = {
        value: `Dr. ${surname.charAt(0).toUpperCase() + surname.slice(1)}`,
        confidence: 0.85,
        level: 'HIGH'
      };
    }

    // 5. Extract Department
    if (/ (cardio|cardiology|heart|dil) /i.test(text)) {
      entities.department = { value: 'Cardiology', confidence: 0.95, level: 'HIGH' };
    } else if (/(ortho|orthopaedics|bone|haddi|joint)/i.test(text)) {
      entities.department = { value: 'Orthopaedics', confidence: 0.95, level: 'HIGH' };
    } else if (/(gynae|gynaecology|pregnancy|delivery|mahila)/i.test(text)) {
      entities.department = { value: 'Gynaecology & Obstetrics', confidence: 0.95, level: 'HIGH' };
    } else if (/(paed|paediatric|child|bacche|vaccine)/i.test(text)) {
      entities.department = { value: 'Paediatrics', confidence: 0.95, level: 'HIGH' };
    } else if (/(medicine|general|sugar|bp|fever|bukhar)/i.test(text)) {
      entities.department = { value: 'General Medicine', confidence: 0.95, level: 'HIGH' };
    }

    return entities;
  }
}
