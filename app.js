'use strict';

$(document).ready(() => {
    // Control creation
    const numeric = new NumericInput('numeric-input');
    const calc = new CalcInput('calc-input');

    [['#numeric-block', numeric], ['#calc-block', calc]]
    .forEach(([blockSelector, control]) => {
        const $b = $(blockSelector);

        // Initial values
        $b.find('.value-display').text(control.value);
        $b.find('.text-display').text(control.text || '""');
        $b.find('.valid-display').text(control.isValid);
        
        // Update values via events
        control.valueChanged.on(value => $b.find('.value-display').text(value));
        control.textChanged.on(value => $b.find('.text-display').text(value || '""'));
        control.isValidChanged.on(value => $b.find('.valid-display').text(value));
    
        // Direct value/text assignment
        $b.find('.set-value-button').click(
            () => control.value = Number($b.find('.set-value-input').val()));
    
        $b.find('.set-text-button').click(
            () => control.text = $b.find('.set-text-input').val());
    });

    // Customized controls
    const customNumeric = new NumericInput('custom-numeric-input');
    const customCalc = new CalcInput('custom-calc-input');
    
    // Destroy all button 
    $('#destroy-all-button').click(() => {
        // Destroy controls
        [numeric, calc, customNumeric, customCalc]
            .forEach(control => control.destroy());

        // Unbind handlers
        $('.set-value-button').add('.set-text-button')
        .add('#destroy-all-button').off('click');
    });

});
