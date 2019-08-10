'use strict';

class BaseInput {
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
                if (text === '') {
                    this._value = null;
                    this._isValid = true;
                    break;
                }

                try {
                    this._value = this._textToValue(text);
                    this._isValid = true;
                }
                catch (ex) {
                    this._value = undefined;
                    this._isValid = false;
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
    _textToValue() {
        throw new Error('Not implemented');
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
    NumericInput control
*/
class NumericInput extends BaseInput {
    // Converts given text to numeric value
    _textToValue(text) {
        const val = Number(text);
        if (isNaN(val)) {
            throw new Error('Not a number');
        }
        return val;
    }
}

/*
    CalcInput control
*/
class CalcInput extends BaseInput {
    _priorities = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2,
    };

    constructor(hostElement) {
        super(hostElement);

        this._resultElement = document.createElement('div');
        this._resultElement.className = 'result-box';
        this._frameElement.append(this._resultElement);
    }

    destroy() {
        super.destroy();
        this._priorities = null;
        this._resultElement = null;
    }

    _update(args) {
        super._update(args);
        this._resultElement.innerText = this.isValid ? this.value : '?';
    }

    // Converts given text to numeric value
    _textToValue(text) {
        return this._calculate(text);
    }
    
    // Recursive formula evaluation
    _calculate(formula) {
		let m = null;
		let op = null;
		formula = formula.trim();
		if (/^$/.test(formula)) {
			throw new Error('Missing operand');
		}
		// Literal number
		else if (/^-?[0-9]*\.?[0-9]+$/.test(formula)) {
			return Number(formula);
		}
		// Unary minus, -op
		else if (m = /^-(.+)$/.exec(formula)) {
			return (- this._calculate(m[1]));
		}
		// Simple expression, op1 + op2
		else if ((op = this._findOperator(formula)) && op.operator) {
			var operand1 = this._calculate(formula.substring(0, op.pos));
			var operand2 = this._calculate(formula.substring(op.pos + op.operator.length));
			switch (op.operator) {
                case '+':
                    return operand1 + operand2;
                case '-':
                    return operand1 - operand2;
                case '*':
                    return operand1 * operand2;
                case '/':
                    return operand1 / operand2;
                default:
                    throw new Error('Unsupported operator '+op.operator);
            }
		}
		// Parenthesis ( )
		else if (m = /^\((.*)\)$/.exec(formula)) {
			return this._calculate(m[1]);
		}
		else {
			throw new Error('Formula syntax error');
		}
    }
    
    // Locate operator in given formula
    _findOperator(formula) {
		let op = {
			operator: '',
			pos: null,
			prio: 100
		};
        let parenthesis = 0, m = null;
        
		for (let i = 0; i < formula.length; i++) {
			if (formula.charAt(i) == '(') {
				parenthesis++;
			}
			else if (formula.charAt(i) == ')') {
				if (parenthesis == 0) {
					throw new Error('Extra closing bracket');
				}
				parenthesis--;
			}
			else if ((parenthesis == 0) && 
				(m = /^(\+|-|\*|\/|)/.exec(formula.substring(i, i+2)))
			) {
				let new_prio = this._priorities[ m[1]];
				if (new_prio != undefined && new_prio <= op.prio) {
					op.operator = m[1];
					op.pos = i;
					op.prio = new_prio;
					i += op.operator.length - 1;
				}
			}
		}
		if (parenthesis != 0) {
			throw new Error('Extra opening bracket');
		} 
		return op;
	}


    
}


// Application entry point
document.addEventListener('DOMContentLoaded', () => {

    const control = new CalcInput('testInput');
    console.log(control);


});
