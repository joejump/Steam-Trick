const parse = (time) => {
    // Hours, minutes and seconds
    const hrs = ~~(time / 3600);
    const mins = ~~((time % 3600) / 60);
    const secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = '';

    if (hrs > 0) {
        ret += `${hrs}:${mins < 10 ? '0' : ''}`;
    }

    ret += `${mins}:${secs < 10 ? '0' : ''}`;
    ret += `${secs}`;
    return ret;
};
export default parse;
