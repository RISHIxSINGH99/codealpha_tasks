const validStatuses = ['todo', 'in-progress', 'review', 'done', 'completed'];

export const isValidTaskStatus = (status) => validStatuses.includes(status);

export const normalizeTaskStatus = (status) => {
  if (status === 'completed') return 'done';
  return status;
};

export const getTaskStatusOptions = () => [
  { key: 'todo', label: 'Todo' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];
