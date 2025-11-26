export const datetimeToString = (date: Date) => {
    return date.toLocaleString('en-us', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const dateToString = (date: Date) => {
    return date.toLocaleString('en-us', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export const prettifyNumber = (value: number, decimals: number = 0): string => {
    const curr = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    return curr.format(+value);
};

export const prettifyNumberNoPad = (value: number, decimals: number = 0): string => {
    const curr = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: decimals
    });
    return curr.format(+value);
};