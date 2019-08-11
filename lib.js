'use strict';

/*
    Helper class for event handlers
*/
class EventObserver {
    constructor() {
        this.handlers = [];
    }

    destroy() {
        this.handlers = null;
    }

    // Subscribe to this event
    on(callback) {
        this.handlers.push(callback);
    }

    // Unsubscribe from this event
    off(callback) {
        this.handlers = this.handlers.filter(cb => cb !== callback);
    }

    // Fire all registered callbacks
    trigger(data) {
        this.handlers.forEach(cb => cb(data));
    }
}

/*
    NumericInput control
*/
class NumericInput {
    constructor(hostElement) {
        // Data properties
        this._value = null;
        this._text = '';
        this._isValid = true;

        // Event observers
        this.valueChanged = new EventObserver();
        this.textChanged = new EventObserver();
        this.isValidChanged = new EventObserver();
    
        // Host element
        this._hostElement = (typeof hostElement === 'string') ?
            document.getElementById(hostElement) : hostElement;
        if (!this._hostElement) {
            throw new Error('Host element not found');
        }

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
            event => this.text = event.target.value);
        this._inputElement.addEventListener('focus',
            () => this._changeTopLevelClass('active', true));
        this._inputElement.addEventListener('blur',
            () => this._changeTopLevelClass('active', false));

        this._frameElement.append(this._inputElement);
    }

    destroy() {
        this._frameElement.remove();
        this._inputElement.remove();

        this.valueChanged.destroy();
        this.textChanged.destroy();
        this.isValidChanged.destroy();

        this._value = this._text = null;
        this.valueChanged = this.textChanged = this.isValidChanged = null;
        this._hostElement = this._frameElement = this._inputElement = null;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (value === null || value === undefined) {
            return this._update({
                value: null,
                text: '',
                isValid: true
            });
        }

        if (typeof value !== 'number') {
            throw new TypeError(`Property 'value' should be a number`);
        }

        this._update({
            value,
            text: String(value),
            isValid: true
        });
    }

    get text() {
        return this._text;
    }

    set text(text) {
        if (typeof text !== 'string') {
            throw new TypeError(`Property 'text' should be a string`);
        }

        if (text === '') {
            return this._update({
                value: null,
                text,
                isValid: true
            });
        }

        try {
            this._update({
                value: this._textToValue(text),
                text,
                isValid: true
            });
        }
        catch (ex) {
            this._update({
                value: undefined,
                text,
                isValid: false
            });
        }
    }

    get isValid() {
        return this._isValid;
    }

    get hostElement() {
        return this._hostElement;
    }

    /*  Update control state 
        'changes' is an object with fields { value, text, isValid }
        Every field is optional
    */
    _update(changes) {
        Object.keys(changes).forEach(field => {
            const newValue = changes[field];
            if (newValue !== this[`_${field}`]) {
                // Update property value
                this[`_${field}`] = newValue;
                if (field === 'text') {
                    this._inputElement.value = newValue;
                } 

                // Fire event handlers
                this[`${field}Changed`].trigger(newValue);
            }
        });

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

    /*  Converts given text to numeric value
        Returns a number or throws an exception
    */
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
class CalcInput extends NumericInput {
    constructor(hostElement) {
        super(hostElement);
        this._priorities = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
        };

        this._resultElement = document.createElement('div');
        this._resultElement.className = 'result-box';
        this._frameElement.append(this._resultElement);
    }

    destroy() {
        super.destroy();
        this._priorities = null;
        this._resultElement = null;
    }

    _update(changes) {
        super._update(changes);
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
		if (formula === '') {
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
				(m = /^(\+|-|\*|\/|)/.exec(formula.substring(i, i+1)))
			) {
				let new_prio = this._priorities[m[1]];
				if (new_prio !== undefined && new_prio <= op.prio) {
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
