<template>
  <GanttChart :groups="testGroups" />
</template>

<script setup>
  import GanttChart from '@/components/GanttChart.vue'

  // 15 тестовых групп обучения
  const testGroups = [
    {
      id: 1,
      name: 'HR-аналитика (продвинутый)',
      startDate: new Date(2026, 3, 10), // 10 апреля 2026
      endDate: new Date(2026, 5, 20), // 20 июня 2026
      progress: 65,
      members: [
        { id: 101, name: 'Анна Иванова' },
        { id: 102, name: 'Ольга Петрова' },
      ],
    },
    {
      id: 2,
      name: 'Бухгалтерский учёт (МСФО)',
      startDate: new Date(2026, 4, 1), // 1 мая 2026
      endDate: new Date(2026, 6, 15), // 15 июля 2026
      progress: 30,
      members: [
        { id: 104, name: 'Сергей Смирнов' },
        { id: 105, name: 'Елена Козлова' },
      ],
    },
    {
      id: 3,
      name: 'Управление проектами (PMP)',
      startDate: new Date(2026, 2, 1), // 1 марта 2026
      endDate: new Date(2026, 4, 30), // 30 мая 2026
      progress: 90,
      members: [
        { id: 106, name: 'Дмитрий Белов' },
        { id: 107, name: 'Ирина Морозова' },
      ],
    },
    {
      id: 4,
      name: 'Цифровая трансформация',
      startDate: new Date(2026, 5, 10), // 10 июня 2026
      endDate: new Date(2026, 8, 5), // 5 сентября 2026
      progress: 15,
      members: [
        { id: 103, name: 'Мария Сидорова' },
        { id: 108, name: 'Алексей Новиков' },
      ],
    },
    {
      id: 5,
      name: 'Data Science для бизнеса',
      startDate: new Date(2026, 3, 1), // 1 апреля 2026
      endDate: new Date(2026, 7, 15), // 15 августа 2026
      progress: 45,
      members: [
        { id: 109, name: 'Павел Григорьев' },
        { id: 110, name: 'Наталья Лебедева' },
        { id: 111, name: 'Максим Фёдоров' },
      ],
    },
    {
      id: 6,
      name: 'Корпоративные финансы',
      startDate: new Date(2026, 1, 15), // 15 февраля 2026
      endDate: new Date(2026, 4, 10), // 10 мая 2026
      progress: 80,
      members: [
        { id: 112, name: 'Екатерина Новикова' },
        { id: 113, name: 'Андрей Морозов' },
      ],
    },
    {
      id: 7,
      name: 'Маркетинг и аналитика',
      startDate: new Date(2026, 6, 1), // 1 июля 2026
      endDate: new Date(2026, 9, 20), // 20 октября 2026
      progress: 10,
      members: [
        { id: 114, name: 'Светлана Васильева' },
        { id: 115, name: 'Олег Кузнецов' },
        { id: 116, name: 'Татьяна Павлова' },
      ],
    },
    {
      id: 8,
      name: 'Управление персоналом (HRBP)',
      startDate: new Date(2026, 0, 20), // 20 января 2026
      endDate: new Date(2026, 3, 5), // 5 апреля 2026
      progress: 95,
      members: [
        { id: 101, name: 'Анна Иванова' }, // конфликт с группой 1 (пересечение?)
        { id: 117, name: 'Юлия Соколова' },
      ],
    },
    {
      id: 9,
      name: 'IT-менеджмент',
      startDate: new Date(2026, 2, 10), // 10 марта 2026
      endDate: new Date(2026, 5, 25), // 25 июня 2026
      progress: 50,
      members: [
        { id: 118, name: 'Владимир Кузьмин' },
        { id: 119, name: 'Александра Белова' },
      ],
    },
    {
      id: 10,
      name: 'Бережливое производство (Lean)',
      startDate: new Date(2026, 7, 1), // 1 августа 2026
      endDate: new Date(2026, 10, 15), // 15 ноября 2026
      progress: 5,
      members: [
        { id: 120, name: 'Григорий Степанов' },
        { id: 121, name: 'Лариса Фролова' },
      ],
    },
    {
      id: 11,
      name: 'Agile и Scrum',
      startDate: new Date(2026, 4, 10), // 10 мая 2026
      endDate: new Date(2026, 7, 20), // 20 августа 2026
      progress: 35,
      members: [
        { id: 122, name: 'Роман Титов' },
        { id: 123, name: 'Кристина Власова' },
      ],
    },
    {
      id: 12,
      name: 'Кибербезопасность',
      startDate: new Date(2026, 8, 1), // 1 сентября 2026
      endDate: new Date(2026, 11, 10), // 10 декабря 2026
      progress: 0,
      members: [
        { id: 124, name: 'Игорь Соловьёв' },
        { id: 125, name: 'Вера Егорова' },
      ],
    },
    {
      id: 13,
      name: 'Стратегическое планирование',
      startDate: new Date(2026, 0, 10), // 10 января 2026
      endDate: new Date(2026, 2, 25), // 25 марта 2026
      progress: 100,
      members: [
        { id: 126, name: 'Борис Алексеев' },
        { id: 127, name: 'Инна Дмитриева' },
      ],
    },
    {
      id: 14,
      name: 'Управление рисками',
      startDate: new Date(2026, 9, 1), // 1 октября 2026
      endDate: new Date(2026, 11, 15), // 15 декабря 2026
      progress: 5,
      members: [
        { id: 128, name: 'Никита Петров' },
        { id: 129, name: 'Алина Семёнова' },
      ],
    },
    {
      id: 15,
      name: 'Эмоциональный интеллект (Soft Skills)',
      startDate: new Date(2026, 3, 15), // 15 апреля 2026
      endDate: new Date(2026, 6, 1), // 1 июля 2026
      progress: 60,
      members: [
        { id: 130, name: 'Валентина Орлова' },
        { id: 131, name: 'Глеб Никифоров' },
      ],
    },
  ]
</script>
