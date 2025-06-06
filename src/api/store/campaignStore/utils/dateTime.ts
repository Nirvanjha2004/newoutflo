export const extractDaysAndHours = (input: string) => {
  const regex = /(\d+)days*(\d+)hours*/;
  const match = input.match(regex);

  if (match) {
    const days = parseInt(match[1], 10);
    const hours = parseInt(match[2], 10);
    return { days, hours };
  } else {
    throw new Error("Invalid format. Please use NdaysNhours");
  }
};
