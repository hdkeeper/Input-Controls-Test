'use strict';

class BaseInput {


}

/*
    NumericInput control
*/
class NumericInput {
    _value = null;
    _isValid = true;

    constructor(hostElement) {
        this._hostElement = (typeof hostElement === 'string') ?
            document.getElementById(hostElement) : hostElement;

        // Outer frame
        this._frameElement = document.createElement('div');
        this._frameElement.className = 'base-input';
        this._hostElement.append(this._frameElement);

        // Input box
        this._inputElement = document.createElement('input');
        this._inputElement.type = 'text';
        this._inputElement.className = 'input-box';

        // Event handlers
        this._inputElement.addEventListener('input',
            event => this._update({ text: event.target.value }));
        this._inputElement.addEventListener('focus',
            () => this._changeTopLevelClass('active', true));
        this._inputElement.addEventListener('blur',
            () => this._changeTopLevelClass('active', false));

        this._frameElement.append(this._inputElement);
    }

    destroy() {
        this._frameElement.remove();
        this._value = null;
        this._hostElement = this._frameElement = this._inputElement = null;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._update({ value });
    }

    get text() {
        return this._inputElement.value;
    }

    set text(text) {
        this._update({ text });
    }

    get isValid() {
        return this._isValid;
    }

    get hostElement() {
        return this._hostElement;
    }

    _update({ text, value }) {
        do {
            if (text !== undefined) {
                // Update text property
                if (typeof text !== 'string') {
                    throw new TypeError(`Property 'text' should be a string`);
                }
    
                this._inputElement.value = text;
                const newValue = this._textToValue(text);
                if (isNaN(newValue)) {
                    this._value = undefined;
                    this._isValid = false;
                }
                else {
                    this._value = newValue;
                    this._isValid = true;
                }
                break;
            }
    
            // Update value property
            if (value === null || value === undefined) {
                this._value = null;
                this._isValid = true;
                this._inputElement.value = '';
                break;
            }
    
            if (typeof value !== 'number') {
                throw new TypeError(`Property 'value' should be a number`);
            }
    
            this._value = value;
            this._isValid = true;
            this._inputElement.value = String(value);
        } while (false);

        // Update frame class
        this._changeTopLevelClass('error', !this.isValid);
    }

    // Converts given text to numeric value
    _textToValue(text) {
        return Number(text);
    }

    _addClass(currentClass, classToAdd) {
        const set = new Set(currentClass.split(/\s+/));
        set.add(classToAdd);
        return [...set].join(' ');
    }

    _removeClass(currentClass, classToRemove) {
        const set = new Set(currentClass.split(/\s+/));
        set.delete(classToRemove);
        return [...set].join(' ');
    }

    // Add or remove class to the top-level element
    _changeTopLevelClass(clName, toAdd) {
        this._frameElement.className = (toAdd ? this._addClass : this._removeClass)(
            this._frameElement.className, clName
        );
    }


}

/*
    CalcInput control
*/
class CalcInput extends BaseInput {

}


// Application entry point
document.addEventListener('DOMContentLoaded', () => {

    const control = new NumericInput('testInput');
    console.log(control);


});
