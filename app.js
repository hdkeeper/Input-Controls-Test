'use strict';

$(document).ready(() => {
    const numeric = new NumericInput('numeric-input');
    const calc = new CalcInput('calc-input');

    [['#numeric-block', numeric], ['#calc-block', calc]]
    .forEach(([blockSelector, control]) => {
        let $b = $(blockSelector);
        $b.find('.value-display').text(control.value);
        $b.find('.text-display').text(control.text || '""');
        $b.find('.valid-display').text(control.isValid);
        
        control.valueChanged.on(value => $b.find('.value-display').text(value));
        control.textChanged.on(value => $b.find('.text-display').text(value || '""'));
        control.isValidChanged.on(value => $b.find('.valid-display').text(value));
    
        $b.find('.set-value-button').click(
            () => control.value = Number($b.find('.set-value-input').val()));
    
        $b.find('.set-text-button').click(
            () => control.text = $b.find('.set-text-input').val());
    });

    const customNumeric = new NumericInput('custom-numeric-input');
    const customCalc = new CalcInput('custom-calc-input');
    
    $('#destroy-all-button').click(() => {
        [numeric, calc, customNumeric, customCalc]
        .forEach(control => control.destroy());
    });

});
