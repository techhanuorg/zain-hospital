const TYPO_MAP: Record<string, string> = {
  // Doctor variations
  'docter': 'doctor',
  'docotr': 'doctor',
  'doktor': 'doctor',
  'dakter': 'doctor',
  'daaktar': 'doctor',
  'daktar': 'doctor',
  'dr.': 'Dr.',
  'dr': 'Dr.',
  'dostor': 'doctor',

  // Common Indian doctor name variations
  'sarma': 'Sharma',
  'sarama': 'Sharma',
  'shrma': 'Sharma',
  'sharm': 'Sharma',
  'vrma': 'Verma',
  'barma': 'Verma',
  'gupt': 'Gupta',
  'guptaji': 'Gupta',
  'mehta': 'Mehta',
  'kapor': 'Kapoor',
  'kapur': 'Kapoor',

  // Appointment & hospital
  'appointmnt': 'appointment',
  'apointment': 'appointment',
  'apointmnt': 'appointment',
  'apntmnt': 'appointment',
  'aptment': 'appointment',
  'hospitl': 'hospital',
  'haspatal': 'hospital',
  'aspataal': 'hospital',
  'aspatal': 'hospital',
  'haospital': 'hospital',
  'receptn': 'reception',
  'reseption': 'reception',

  // Departments & specialities
  'cardilogist': 'cardiologist',
  'cardio': 'cardiology',
  'cardiology': 'cardiology',
  'dil': 'cardiology',
  'heart': 'cardiology',
  'ortho': 'orthopaedics',
  'haddi': 'orthopaedics',
  'haddiyo': 'orthopaedics',
  'gynae': 'gynaecology',
  'gyno': 'gynaecology',
  'mahila': 'gynaecology',
  'aurat': 'gynaecology',
  'baccho': 'paediatrics',
  'bacche': 'paediatrics',
  'child': 'paediatrics',
  'pediatric': 'paediatrics',
  'paediatric': 'paediatrics',
  'skin': 'dermatology',
  'twacha': 'dermatology',
  'derma': 'dermatology',
  'neuro': 'neurology',
  'dimag': 'neurology',
  'nas': 'neurology',

  // Time & date
  'shm': 'shaam',
  'sham': 'shaam',
  'saam': 'shaam',
  'subh': 'subah',
  'subha': 'subah',
  'dophar': 'dopahar',
  'dophr': 'dopahar',
  'rat': 'raat',
  'raat': 'raat',
  'tomorow': 'kal',
  'tommorow': 'kal',
  'tomorrow': 'kal',
  'today': 'aaj',
  'aj': 'aaj',
  'parso': 'parso',
  'prso': 'parso',

  // Common verbs
  'dikhana': 'dikhana',
  'dikhan': 'dikhana',
  'milna': 'milna',
  'dekho': 'dikhana',
  'khatam': 'khatam',
  'khtm': 'khatam',
  'cancle': 'cancel',
  'cancl': 'cancel',
  'cncl': 'cancel',
  'reschedul': 'reschedule',
  'badalna': 'reschedule',
  'change': 'reschedule',
};

export class MessageNormalizer {
  public static normalize(input: string): string {
    if (!input) return '';
    let cleaned = input.trim();

    // Replace multiple spaces with a single space
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Normalize punctuation
    cleaned = cleaned.replace(/[\?\.!]+$/g, '');

    const words = cleaned.split(' ');
    const normalizedWords = words.map(w => {
      const lower = w.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/g, '');
      if (TYPO_MAP[lower]) {
        return TYPO_MAP[lower];
      }
      return w;
    });

    return normalizedWords.join(' ');
  }
}
