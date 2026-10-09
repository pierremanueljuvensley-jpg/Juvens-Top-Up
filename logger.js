export const logger = {
  info(event, data = {}) {
    console.log(JSON.stringify({ level: "info", event, ...data }));
  },
  error(event, data = {}) {
    console.error(JSON.stringify({ level: "error", event, ...data }));
  }
};
