import moment from "moment";

export const formatDate = (date: string | Date | moment.Moment): string => {
  if (typeof date === "string") {
    date = new Date(date);
  }

  if (date instanceof Date) {
    date = moment(date);
  }

  return date.format("DD/MM/yyyy");
};

export const debounce = <T extends CallableFunction>(
  fn: T,
  delay: number
): T => {
  let timer: ReturnType<typeof setTimeout>;

  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    setTimeout(() => {
      fn(...args);
    }, delay);
  }) as any;
};
