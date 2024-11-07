module.exports = {
  presets: [
    {
      name: 'auditFields',
      fields: {
        createdBy: 'User',
        updatedBy: 'User',
        deletedBy: 'User',
      },
    },
  ],
};
