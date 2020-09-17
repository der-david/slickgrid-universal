/// <reference types="Cypress" />
import { changeTimezone, zeroPadding } from '../plugins/utilities';

describe('Example 12 - Composite Editor Modal', () => {
  const fullPreTitles = ['', 'Common Factor', 'Analysis', 'Period', 'Item', ''];
  const fullTitles = ['', 'Title', 'Duration', 'Cost', '% Complete', 'Start', 'Completed', 'Finish', 'Product', 'Country of Origin', 'Action'];

  const GRID_ROW_HEIGHT = 33;
  const UNSAVED_RGB_COLOR = 'rgb(221, 219, 218)';

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example12`);
    cy.get('h3').should('contain', 'Example 12 - Composite Editor Modal');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid12')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid12')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have "TASK 0" (uppercase) incremented by 1 after each row', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 5');
  });

  it('should be able to change "Duration" values of first 4 rows', () => {
    // change duration
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'days').click();
    cy.get('.editor-duration').type('0').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`)
      .should('contain', '0 day')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get('.editor-duration').type('1').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', '1 day')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get('.editor-duration').type('2').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', '2 days')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should be able to change "Title" values of row indexes 1-3', () => {
    // change title
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1').click();
    cy.get('.editor-title').type('task 1111');
    cy.get('.editor-title .editor-footer .btn-save').click();
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1111')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 2').click();
    cy.get('.editor-title').type('task 2222');
    cy.get('.editor-title .editor-footer .btn-save').click();
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 2222')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should be able to change "% Complete" values of row indexes 2-4', () => {
    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 5).trigger('change').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '5')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 6).trigger('change').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).should('contain', '6')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should not be able to change the "Finish" dates on first 2 rows', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('contain', '').click(); // this date should also always be initially empty
    cy.get(`.flatpickr-day.today:visible`).should('not.exist');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).should('contain', '').click(); // this date should also always be initially empty
    cy.get(`.flatpickr-day.today:visible`).should('not.exist');
  });

  it('should be able to change "Completed" values of row indexes 2-4', () => {
    // change Completed
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).click();
    cy.get('.editor-completed').check();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).click();
    cy.get('.editor-completed').check();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).click();
    cy.get('.editor-completed').check();
  });

  it('should be able to change "Finish" values of row indexes 0-2', () => {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = changeTimezone(now, tz);

    const currentDate = today.getDate();
    let currentMonth = today.getMonth() + 1; // month is zero based, let's add 1 to it
    if (currentMonth < 10) {
      currentMonth = `0${currentMonth}`; // add zero padding
    }
    const currentYear = today.getFullYear();

    // change Finish date to today's date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('contain', '').click(); // this date should also always be initially empty
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).click();
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).click();
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get('.unsaved-editable-field')
      .should('have.length', 13);
  });

  it('should undo last edit and expect the date editor to be opened as well when clicking the associated last undo with editor button', () => {
    cy.get('[data-test=undo-open-editor-btn]').click();

    cy.get('.flatpickr-calendar.open')
      .should('exist');

    cy.get('.unsaved-editable-field')
      .should('have.length', 12);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`)
      .should('contain', '')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should undo last edit and expect the date editor to NOT be opened when clicking undo last edit button', () => {
    cy.get('[data-test=undo-last-edit-btn]').click();

    cy.get('.flatpickr-calendar.open')
      .should('not.exist');

    cy.get('.unsaved-editable-field')
      .should('have.length', 11);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`)
      .should('contain', '')
      .get('.editing-field')
      .should('have.css', 'border').and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should click on the "Save" button and expect 2 console log calls with the queued items & also expect no more unsaved cells', () => {
    cy.get('[data-test=save-all-btn]').click();

    cy.get('.unsaved-editable-field')
      .should('have.length', 0);

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(2);
    });
  });

  it('should be able to toggle the grid to readonly', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editing-field')
      .should('have.length', 0);
  });

  it('should be able to toggle back the grid to editable', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editing-field')
      .should('not.have.length', 0);
  });

  it('should open the Composite Editor (Create Item) and expect all form inputs to be empty', () => {
    cy.get('[data-test="open-modal-create-btn"]').click();

    cy.get('.slick-editor-modal-title').contains('Inserting New Task');

    cy.get('textarea').should('be.empty');
    cy.get('.item-details-editor-container .input-group-text').contains('0');
    cy.get('.editor-checkbox').should('be.not.checked');
    cy.get('.item-details-container.editor-product .autocomplete').should('be.empty');
    cy.get('.item-details-container.editor-duration .editor-text').should('be.empty');
    cy.get('.item-details-container.editor-start .flatpickr-alt-input').should('be.empty');
    cy.get('.item-details-container.editor-finish .flatpickr-alt-input').should('be.empty').should('be.disabled');
    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').should('be.empty');
  });

  it('should not be able to save, neither expect the modal window to close when having invalid fields', () => {
    cy.get('.btn-save').contains('Save').click();

    cy.get('.slick-editor-modal').should('exist');
    cy.get('.item-details-container.editor-title .item-details-validation').contains('* This is a required field.');
  });

  it('should fill in the (Create Item) form inputs and expect a new row in the grid', () => {
    cy.get('textarea').type('Task');
    cy.get('.item-details-container.editor-title .item-details-validation').contains('* Your title is invalid, it must start with "Task" followed by a number.');
    cy.get('textarea').type(' 8888');
    cy.get('.item-details-container.editor-title .item-details-validation').should('be.empty');
    cy.get('.item-details-container.editor-title .modified').should('have.length', 1);

    // cy.get('.slick-large-editor-text.editor-title')
    //   .should('have.css', 'border')
    //   .and('eq', `1px solid ${UNSAVED_RGB_COLOR}`);

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete').as('range').invoke('val', 5).trigger('change').type('{enter}', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('5');
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.editor-completed .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-product .autocomplete').type('granite');
    cy.get('.ui-menu.ui-autocomplete.autocomplete-custom-four-corners').should('be.visible');
    cy.get('.ui-menu.ui-autocomplete.autocomplete-custom-four-corners').find('li.ui-menu-item:nth(0)').click();
    cy.get('.item-details-container.editor-product .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-duration .editor-text').type('22');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains('* You must provide a "Finish" date when "Completed" is checked.');
    cy.get('.item-details-container.editor-finish .flatpickr-alt-input').click({ force: true });
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').type('c');
    cy.get('.ui-menu.ui-autocomplete:visible').find('li.ui-menu-item:nth(1)').click();
    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').invoke('val').then(text => expect(text).to.eq('Antarctica'));
    cy.get('.item-details-container.editor-countryOfOrigin .modified').should('have.length', 1);

    cy.get('.btn-save').contains('Save').click();
    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have new TASK 8888 displayed on first row', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 8888');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '22 days');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '5');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).find('.editing-field').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('contain', 'Tasty Granite Table');
  });

  it('should open the Composite Editor (Edit Item) and expect all form inputs to be filled with TASK 8888 data of previous create item', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('[data-test="open-modal-edit-btn"]').click();
    cy.get('[data-test="open-modal-edit-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Editing - Task 8888 (id: 501)');

    cy.get('textarea').contains('Task 8888').type('Task 8899');
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete').as('range').invoke('val', 17).trigger('change'); // .type('{enter}', { force: true });

    cy.get('.item-details-editor-container .editor-checkbox').uncheck();
    cy.get('.item-details-container.editor-duration input.editor-text').type('33');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').type('da');
    cy.get('.ui-menu.ui-autocomplete:visible').find('li.ui-menu-item:nth(1)').click();
    cy.get('.item-details-container.editor-countryOfOrigin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').invoke('val').then(text => expect(text).to.eq('Bermuda'));

    cy.get('.btn-save').contains('Save').click({ force: true });
    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have new TASK 8888 displayed on first row', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 8899');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '33 days');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '17');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).find('.editing-field').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('not.exist');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('contain', 'Tasty Granite Table');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Bermuda');
  });

  it('should open the Composite Editor (Mass Update) and be able to change some of the inputs in the form', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).click();
    cy.get('[data-test="open-modal-mass-update-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Mass Update All Records');
    cy.get('.footer-status-text').contains('All 501 records selected');

    cy.get('.item-details-editor-container .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains('* You must provide a "Finish" date when "Completed" is checked.');
    cy.get('.item-details-container.editor-finish .flatpickr-alt-input').click({ force: true });
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').type('bel');
    cy.get('.ui-menu.ui-autocomplete:visible').find('li.ui-menu-item:nth(1)').click();
    cy.get('.item-details-container.editor-countryOfOrigin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').invoke('val').then(text => expect(text).to.eq('Belgium'));

    cy.get('.btn-save').contains('Apply Mass Update').click();
    cy.get('.validation-summary').contains('Unfortunately we only accept a minimum of 50% Completion...');

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete').as('range').invoke('val', 51).trigger('change').type('{enter}', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('51');
    cy.get('.btn-save').contains('Apply Mass Update').click();

    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have updated values in the entire grid', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');
  });

  it('should have the "Mass Selection" button disabled when no rows are selected', () => {
    cy.get('[data-test="open-modal-mass-selection-btn"]').should('be.disabled');
  });

  it('should select row 1 and 2', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0)`).click();
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(0)`).click();
    cy.get('[data-test="open-modal-mass-selection-btn"]').should('not.be.disabled');
    cy.get('[data-test="open-modal-mass-selection-btn"]').click();
  });

  it('should be able to open the Composite Editor (Mass Selection) and be able to change some of the inputs in the form', () => {
    cy.get('.slick-editor-modal-title').contains('Update Selected Records');
    cy.get('.footer-status-text').contains('2 of 501 selected');

    cy.get('.item-details-editor-container .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains('* You must provide a "Finish" date when "Completed" is checked.');
    cy.get('.item-details-container.editor-finish .flatpickr-alt-input').click({ force: true });
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').type('ze');
    cy.get('.ui-menu.ui-autocomplete:visible').find('li.ui-menu-item:nth(1)').click();
    cy.get('.item-details-container.editor-countryOfOrigin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-countryOfOrigin .autocomplete').invoke('val').then(text => expect(text).to.eq('Belize'));

    cy.get('.btn-save').contains('Update Selection').click();
    cy.get('.validation-summary').contains('Unfortunately we only accept a minimum of 50% Completion...');

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete').as('range').invoke('val', 77).trigger('change').type('{enter}', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('77');
    cy.get('.btn-save').contains('Update Selection').click();

    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have updated all the changed values BUT only on the 2 selected rows', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should('contain', '77');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(9)`).should('contain', 'Belize');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '77');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(9)`).should('contain', 'Belize');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(6)`).find('.mdi.mdi-check.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(7)`).should('not.be.empty');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(9)`).should('contain', 'Belgium');
  });
});