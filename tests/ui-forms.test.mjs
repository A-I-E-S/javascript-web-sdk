import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AFRICANIES_FORM_ELEMENTS,
  CheckboxComponent,
  DatePickerComponent,
  NumberInputComponent,
  OtpInputComponent,
  SearchComboboxComponent,
  SelectComponent,
  TextInputComponent,
  TextareaComponent,
  ToggleComponent
} from '../packages/ui/dist/index.js';

test('basic form package exposes all ten Angular-equivalent custom elements', () => {
  assert.deepEqual(Object.keys(AFRICANIES_FORM_ELEMENTS), [
    'africanies-text-input', 'africanies-textarea', 'africanies-number-input', 'africanies-checkbox',
    'africanies-radio', 'africanies-toggle', 'africanies-date-picker', 'africanies-otp-input',
    'africanies-select', 'africanies-search-combobox'
  ]);
});

test('form controls are opt-in form-associated elements with accessible error inputs', () => {
  for (const Control of [TextInputComponent, TextareaComponent, NumberInputComponent, CheckboxComponent, ToggleComponent, DatePickerComponent, OtpInputComponent, SelectComponent, SearchComboboxComponent]) {
    assert.equal(Control.formAssociated, true);
    assert.ok(Control.observedAttributes.includes('error'));
    assert.ok(Control.observedAttributes.includes('required'));
    assert.ok(Control.observedAttributes.includes('disabled'));
  }
  const source = TextInputComponent.prototype.constructor.toString();
  assert.ok(source.length > 0);
});

test('select and combobox accept typed option lists without requiring browser globals', () => {
  const options = [{ label: 'Nigeria', value: 'NG' }, { label: 'Ghana', value: 'GH', disabled: true }];
  const select = new SelectComponent();
  const combobox = new SearchComboboxComponent();
  select.options = options;
  combobox.options = options;
  assert.deepEqual(select.options, options);
  assert.deepEqual(combobox.options, options);
});

test('number control distinguishes blank values from numeric zero', () => {
  const input = new NumberInputComponent();
  input.value = '';
  assert.equal(input.valueAsNumber, null);
  input.value = '0';
  assert.equal(input.valueAsNumber, 0);
});
