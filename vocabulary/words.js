/* Spanish vocabulary (Spain) with English meanings — Practice with Ehsan
 * TOPICS: id -> name; WORDS: [topic, Spanish, English]. Nouns come with their article (el/la).
 */
window.VOCAB_TOPICS = [
  { id: 'greet', name: 'Greetings and phrases', icon: '👋' },
  { id: 'num', name: 'Numbers', icon: '🔢' },
  { id: 'color', name: 'Colours', icon: '🎨' },
  { id: 'family', name: 'Family and people', icon: '👪' },
  { id: 'food', name: 'Food and drink', icon: '🍽️' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'clothes', name: 'Clothes', icon: '👕' },
  { id: 'body', name: 'The body', icon: '🖐️' },
  { id: 'time', name: 'Time and days', icon: '📅' },
  { id: 'city', name: 'City and travel', icon: '🚆' },
  { id: 'verbs', name: 'Common verbs', icon: '🏃' },
  { id: 'adj', name: 'Describing words', icon: '✨' }
];

window.VOCAB_WORDS = [
  // greetings and phrases
  ['greet', 'hola', 'hello'], ['greet', 'adiós', 'goodbye'], ['greet', 'buenos días', 'good morning'],
  ['greet', 'buenas tardes', 'good afternoon'], ['greet', 'buenas noches', 'good evening / good night'],
  ['greet', 'por favor', 'please'], ['greet', 'gracias', 'thank you'], ['greet', 'de nada', "you're welcome"],
  ['greet', 'perdón', 'sorry / excuse me'], ['greet', 'lo siento', "I'm sorry"], ['greet', 'sí', 'yes'], ['greet', 'no', 'no'],
  ['greet', '¿qué tal?', "how are you? / how's it going?"], ['greet', 'muy bien', 'very well'],
  ['greet', 'encantado', 'nice to meet you (said by a man)'], ['greet', 'encantada', 'nice to meet you (said by a woman)'],
  ['greet', 'hasta luego', 'see you later'], ['greet', 'hasta mañana', 'see you tomorrow'],
  ['greet', 'me llamo', 'my name is'], ['greet', '¿cómo te llamas?', "what's your name?"], ['greet', 'vale', 'OK'],
  ['greet', '¿dónde está?', 'where is it?'], ['greet', 'no entiendo', "I don't understand"], ['greet', '¿cuánto cuesta?', 'how much is it?'],

  // numbers
  ['num', 'cero', 'zero'], ['num', 'uno', 'one'], ['num', 'dos', 'two'], ['num', 'tres', 'three'], ['num', 'cuatro', 'four'],
  ['num', 'cinco', 'five'], ['num', 'seis', 'six'], ['num', 'siete', 'seven'], ['num', 'ocho', 'eight'], ['num', 'nueve', 'nine'],
  ['num', 'diez', 'ten'], ['num', 'once', 'eleven'], ['num', 'doce', 'twelve'], ['num', 'quince', 'fifteen'], ['num', 'veinte', 'twenty'],
  ['num', 'treinta', 'thirty'], ['num', 'cincuenta', 'fifty'], ['num', 'cien', 'one hundred'], ['num', 'mil', 'one thousand'],
  ['num', 'primero', 'first'], ['num', 'segundo', 'second'], ['num', 'último', 'last'],

  // colours
  ['color', 'rojo', 'red'], ['color', 'azul', 'blue'], ['color', 'verde', 'green'], ['color', 'amarillo', 'yellow'],
  ['color', 'negro', 'black'], ['color', 'blanco', 'white'], ['color', 'gris', 'grey'], ['color', 'naranja', 'orange (colour)'],
  ['color', 'rosa', 'pink'], ['color', 'marrón', 'brown'], ['color', 'morado', 'purple'],

  // family and people
  ['family', 'la familia', 'family'], ['family', 'el padre', 'father'], ['family', 'la madre', 'mother'], ['family', 'los padres', 'parents'],
  ['family', 'el hermano', 'brother'], ['family', 'la hermana', 'sister'], ['family', 'el hijo', 'son'], ['family', 'la hija', 'daughter'],
  ['family', 'el abuelo', 'grandfather'], ['family', 'la abuela', 'grandmother'], ['family', 'el tío', 'uncle'], ['family', 'la tía', 'aunt'],
  ['family', 'el primo', 'cousin (boy)'], ['family', 'la prima', 'cousin (girl)'], ['family', 'el marido', 'husband'], ['family', 'la mujer', 'woman / wife'],
  ['family', 'el hombre', 'man'], ['family', 'el niño', 'boy / child'], ['family', 'la niña', 'girl'], ['family', 'el amigo', 'friend (male)'],
  ['family', 'la amiga', 'friend (female)'], ['family', 'el novio', 'boyfriend'], ['family', 'la novia', 'girlfriend'], ['family', 'la gente', 'people'],

  // food and drink
  ['food', 'el agua', 'water'], ['food', 'el pan', 'bread'], ['food', 'la leche', 'milk'], ['food', 'el café', 'coffee'], ['food', 'el té', 'tea'],
  ['food', 'el zumo', 'juice'], ['food', 'el vino', 'wine'], ['food', 'la cerveza', 'beer'], ['food', 'la carne', 'meat'], ['food', 'el pollo', 'chicken'],
  ['food', 'el pescado', 'fish (to eat)'], ['food', 'el huevo', 'egg'], ['food', 'el queso', 'cheese'], ['food', 'el jamón', 'ham'], ['food', 'el arroz', 'rice'],
  ['food', 'la patata', 'potato'], ['food', 'la manzana', 'apple'], ['food', 'la naranja', 'orange (fruit)'], ['food', 'la fruta', 'fruit'],
  ['food', 'la verdura', 'vegetables'], ['food', 'el desayuno', 'breakfast'], ['food', 'la comida', 'lunch / food'], ['food', 'la cena', 'dinner'],
  ['food', 'el azúcar', 'sugar'], ['food', 'la sal', 'salt'], ['food', 'la cuenta', 'the bill'],

  // home
  ['home', 'la casa', 'house / home'], ['home', 'el piso', 'flat / apartment'], ['home', 'la habitación', 'room / bedroom'], ['home', 'la cocina', 'kitchen'],
  ['home', 'el baño', 'bathroom'], ['home', 'el salón', 'living room'], ['home', 'la mesa', 'table'], ['home', 'la silla', 'chair'], ['home', 'la cama', 'bed'],
  ['home', 'la puerta', 'door'], ['home', 'la ventana', 'window'], ['home', 'la llave', 'key'], ['home', 'el ordenador', 'computer'],
  ['home', 'el móvil', 'mobile phone'], ['home', 'la ducha', 'shower'], ['home', 'el libro', 'book'],

  // clothes
  ['clothes', 'la ropa', 'clothes'], ['clothes', 'la camisa', 'shirt'], ['clothes', 'la camiseta', 'T-shirt'], ['clothes', 'los pantalones', 'trousers'],
  ['clothes', 'la falda', 'skirt'], ['clothes', 'el vestido', 'dress'], ['clothes', 'los zapatos', 'shoes'], ['clothes', 'el abrigo', 'coat'],
  ['clothes', 'la chaqueta', 'jacket'], ['clothes', 'el sombrero', 'hat'], ['clothes', 'los calcetines', 'socks'], ['clothes', 'el bolso', 'handbag'],

  // the body
  ['body', 'la cabeza', 'head'], ['body', 'la cara', 'face'], ['body', 'el ojo', 'eye'], ['body', 'la oreja', 'ear'], ['body', 'la nariz', 'nose'],
  ['body', 'la boca', 'mouth'], ['body', 'el diente', 'tooth'], ['body', 'el pelo', 'hair'], ['body', 'la mano', 'hand'], ['body', 'el brazo', 'arm'],
  ['body', 'la pierna', 'leg'], ['body', 'el pie', 'foot'], ['body', 'el corazón', 'heart'], ['body', 'la espalda', 'back'],

  // time and days
  ['time', 'el día', 'day'], ['time', 'la semana', 'week'], ['time', 'el mes', 'month'], ['time', 'el año', 'year'], ['time', 'hoy', 'today'],
  ['time', 'mañana', 'tomorrow'], ['time', 'ayer', 'yesterday'], ['time', 'ahora', 'now'], ['time', 'siempre', 'always'], ['time', 'nunca', 'never'],
  ['time', 'lunes', 'Monday'], ['time', 'martes', 'Tuesday'], ['time', 'miércoles', 'Wednesday'], ['time', 'jueves', 'Thursday'],
  ['time', 'viernes', 'Friday'], ['time', 'sábado', 'Saturday'], ['time', 'domingo', 'Sunday'], ['time', 'la hora', 'hour / time (of day)'],
  ['time', 'temprano', 'early'], ['time', 'tarde', 'late'], ['time', 'la mañana', 'morning'], ['time', 'la noche', 'night'],

  // city and travel
  ['city', 'la ciudad', 'city'], ['city', 'la calle', 'street'], ['city', 'el pueblo', 'village / small town'], ['city', 'la tienda', 'shop'],
  ['city', 'el mercado', 'market'], ['city', 'el banco', 'bank / bench'], ['city', 'el hospital', 'hospital'], ['city', 'la farmacia', 'chemist / pharmacy'],
  ['city', 'la estación', 'station'], ['city', 'el aeropuerto', 'airport'], ['city', 'el tren', 'train'], ['city', 'el autobús', 'bus'],
  ['city', 'el coche', 'car'], ['city', 'el billete', 'ticket'], ['city', 'el hotel', 'hotel'], ['city', 'la playa', 'beach'], ['city', 'la montaña', 'mountain'],
  ['city', 'el restaurante', 'restaurant'], ['city', 'a la izquierda', 'on the left'], ['city', 'a la derecha', 'on the right'], ['city', 'todo recto', 'straight on'],
  ['city', 'cerca', 'near'], ['city', 'lejos', 'far'],

  // common verbs
  ['verbs', 'ser', 'to be (who or what something is)'], ['verbs', 'estar', 'to be (where, or how something is now)'], ['verbs', 'tener', 'to have'],
  ['verbs', 'hacer', 'to do / to make'], ['verbs', 'ir', 'to go'], ['verbs', 'venir', 'to come'], ['verbs', 'poder', 'can / to be able to'],
  ['verbs', 'querer', 'to want / to love'], ['verbs', 'decir', 'to say / to tell'], ['verbs', 'ver', 'to see'], ['verbs', 'dar', 'to give'],
  ['verbs', 'saber', 'to know (a fact)'], ['verbs', 'conocer', 'to know (a person or place)'], ['verbs', 'hablar', 'to speak'], ['verbs', 'comer', 'to eat'],
  ['verbs', 'beber', 'to drink'], ['verbs', 'vivir', 'to live'], ['verbs', 'trabajar', 'to work'], ['verbs', 'estudiar', 'to study'],
  ['verbs', 'dormir', 'to sleep'], ['verbs', 'salir', 'to go out / to leave'], ['verbs', 'llegar', 'to arrive'], ['verbs', 'entender', 'to understand'],
  ['verbs', 'necesitar', 'to need'], ['verbs', 'gustar', 'to like (literally: to please)'], ['verbs', 'pensar', 'to think'], ['verbs', 'buscar', 'to look for'],
  ['verbs', 'comprar', 'to buy'], ['verbs', 'escribir', 'to write'], ['verbs', 'leer', 'to read'], ['verbs', 'abrir', 'to open'], ['verbs', 'cerrar', 'to close'],

  // describing words
  ['adj', 'grande', 'big'], ['adj', 'pequeño', 'small'], ['adj', 'bueno', 'good'], ['adj', 'malo', 'bad'], ['adj', 'nuevo', 'new'], ['adj', 'viejo', 'old'],
  ['adj', 'joven', 'young'], ['adj', 'bonito', 'pretty / nice'], ['adj', 'feo', 'ugly'], ['adj', 'alto', 'tall / high'], ['adj', 'bajo', 'short / low'],
  ['adj', 'largo', 'long'], ['adj', 'corto', 'short (length)'], ['adj', 'caro', 'expensive'], ['adj', 'barato', 'cheap'], ['adj', 'fácil', 'easy'],
  ['adj', 'difícil', 'difficult'], ['adj', 'rápido', 'fast'], ['adj', 'lento', 'slow'], ['adj', 'caliente', 'hot (to touch)'], ['adj', 'frío', 'cold'],
  ['adj', 'feliz', 'happy'], ['adj', 'triste', 'sad'], ['adj', 'cansado', 'tired'], ['adj', 'contento', 'pleased / glad'], ['adj', 'simpático', 'nice / friendly']
];
