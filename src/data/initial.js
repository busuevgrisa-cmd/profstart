// src/data/initial.js
export const INITIAL_USERS = [
  { id: 'admin-1', role: 'admin', name: 'Администратор', email: 'admin@profstart.ru', password: 'admin123', institution: 'ПрофСтарт' },
  { id: 'teacher-1', role: 'teacher', name: 'Иванова Мария Петровна', email: 'ivanova@college.ru', password: 'teacher123', institution: 'Технический колледж №5' },
  { id: 'student-1', role: 'student', name: 'Петров Алексей', email: 'petrov@student.ru', password: 'student123', group: 'ТМ-301', institution: 'Технический колледж №5' },
  { id: 'student-2', role: 'student', name: 'Сидорова Анна', email: 'sidorova@student.ru', password: 'student123', group: 'ТМ-301', institution: 'Технический колледж №5' },
];

export const INITIAL_SCENES = [
  {
    id: 'scene-lathe',
    name: 'Токарный станок ТВ-16',
    type: 'workshop',
    description: 'Виртуальный токарный станок для обработки деталей вращения',
    preview: '🔧',
    steps: [
      { id: 's1', title: 'Проверка оборудования', description: 'Осмотрите станок, проверьте крепление суппорта и патрона', hint: 'Начните с визуального осмотра станка. Нажмите на кнопку "Осмотр"', object: 'lathe_body', color: '#22c55e' },
      { id: 's2', title: 'Закрепление заготовки', description: 'Установите заготовку в патрон и зажмите кулачки', hint: 'Нажмите на патрон, чтобы открыть его, затем вставьте заготовку', object: 'chuck', color: '#22c55e' },
      { id: 's3', title: 'Выбор режима резания', description: 'Установите обороты шпинделя: 500 об/мин, подачу: 0.15 мм/об', hint: 'Используйте панель управления справа. Скорость: 500, подача: 0.15', object: 'control_panel', color: '#22c55e' },
      { id: 's4', title: 'Установка инструмента', description: 'Закрепите резец в резцедержателе', hint: 'Нажмите на резцедержатель и выберите проходной резец', object: 'tool_holder', color: '#22c55e' },
      { id: 's5', title: 'Включение станка', description: 'Запустите шпиндель и начните точение', hint: 'Убедитесь, что все настройки верны, затем нажмите зелёную кнопку "Пуск"', object: 'start_button', color: '#22c55e' },
      { id: 's6', title: 'Обработка детали', description: 'Выполните продольное точение до требуемого диаметра', hint: 'Переместите суппорт вдоль детали с помощью маховика', object: 'carriage', color: '#22c55e' },
      { id: 's7', title: 'Остановка и контроль', description: 'Остановите станок, снимите деталь, измерьте размеры', hint: 'Нажмите красную кнопку "Стоп", затем кнопку "Контроль качества"', object: 'stop_button', color: '#22c55e' },
    ]
  },
  {
    id: 'scene-digital',
    name: 'Цифровой двойник завода «МеталлПром»',
    type: 'digital',
    description: 'Управление производственным предприятием: закупки, смены, ценообразование',
    preview: '🏭',
    defaultData: {
      rawMaterialCost: 5000,
      laborCost: 3000,
      overheadCost: 1500,
      productionVolume: 1000,
      salePrice: 12000,
      purchaseVolume: 800,
      shifts: 2,
      warehouseCost: 500,
    }
  }
];

export const INITIAL_PRACTICES = [
  {
    id: 'practice-1',
    teacherId: 'teacher-1',
    sceneId: 'scene-lathe',
    title: 'Токарная обработка детали "Вал"',
    group: 'ТМ-301',
    mode: 'training',
    requiredAttempts: 2,
    showErrors: true,
    active: true,
    createdAt: new Date().toISOString(),
    criteria: 'Соблюдение технологической последовательности, достижение параметров: диаметр 25±0.05 мм',
  },
  {
    id: 'practice-2',
    teacherId: 'teacher-1',
    sceneId: 'scene-digital',
    title: 'Оптимизация себестоимости продукции',
    group: 'ТМ-301',
    mode: 'training',
    requiredAttempts: 1,
    showErrors: true,
    active: true,
    createdAt: new Date().toISOString(),
    criteria: 'Снизить себестоимость продукции минимум на 5% при сохранении объёма производства',
    targetCostReduction: 5,
  }
];
