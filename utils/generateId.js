const generateUniqueId = (type) => {
    const now = new Date();
    const { year, month, day, hours, minutes, seconds, miliseconds } = {
      year: now.getFullYear().toString().padStart(4, "0"),
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
      day: now.getDate().toString().padStart(2, "0"),
      hours: now.getHours().toString().padStart(2, "0"),
      minutes: now.getMinutes().toString().padStart(2, "0"),
      seconds: now.getSeconds().toString().padStart(2, "0"),
      miliseconds: now.getMilliseconds().toString().padStart(3, "0"),
    };
  
    return `${type}${year}${month}${day}${hours}${minutes}${seconds}${miliseconds}`;
  };

  export default generateUniqueId;