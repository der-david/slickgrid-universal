/// <reference types="cypress" />

describe('Example 01 - Basic Grids', () => {
  const GRID_ROW_HEIGHT = 33;
  const fullTitles = ['Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(Cypress.config('baseExampleUrl'), { timeout: 200000 });
    cy.get('h3').should('contain', 'Example 01 - Basic Grids');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have 2 grids of size 800 by 225px', () => {
    cy.get('.grid1')
      .should('have.css', 'width', '800px');

    cy.get('.grid1 > .slickgrid-container')
      .should('have.css', 'height', '225px');

    cy.get('.grid2')
      .should('have.css', 'width', '800px');

    cy.get('.grid2 > .slickgrid-container')
      .should('have.css', 'height', '255px');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should hover over the "Title" column header menu of 1st grid and click on "Sort Descending" command', () => {
    cy.get('.grid1')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .children('.slick-header-menubutton')
      .click();

    cy.get('.slick-header-menu')
      .should('be.visible')
      .children('.slick-header-menuitem:nth-child(2)')
      .children('.slick-header-menucontent')
      .should('contain', 'Sort Descending')
      .click();

    cy.get('.slick-row')
      .first()
      .children('.slick-cell')
      .first()
      .should('contain', 'Task 994');
  });

  it('should have a Grid Preset Filter on 1st Title column and expect all rows to be filtered as well', () => {
    cy.get('input.search-filter.filter-title')
      .invoke('val')
      .then(text => expect(text).to.eq('2'));

    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', 'Task 122');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0)`).should('contain', 'Task 123');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(0)`).should('contain', 'Task 124');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0)`).should('contain', 'Task 125');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(0)`).should('contain', 'Task 126');
  });

  it('should hover over the "Title" column of 2nd grid and click on "Sort Ascending" command', () => {
    cy.get('.grid2')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .children('.slick-header-menubutton')
      .invoke('show')
      .click();

    cy.get('.slick-header-menu')
      .should('be.visible')
      .children('.slick-header-menuitem:nth-child(1)')
      .children('.slick-header-menucontent')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', 'Task 122');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0)`).should('contain', 'Task 123');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(0)`).should('contain', 'Task 124');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0)`).should('contain', 'Task 125');
    cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(0)`).should('contain', 'Task 126');
  });

  it('should hover over the "Duration" column of 2nd grid, Sort Ascending and have 2 sorts', () => {
    cy.get('.grid2')
      .find('.slick-header-column:nth-child(2)')
      .trigger('mouseover')
      .children('.slick-header-menubutton')
      .invoke('show')
      .click();

    cy.get('.grid2')
      .find('.slick-header-menu')
      .should('be.visible')
      .children('.slick-header-menuitem:nth-child(2)')
      .click();

    cy.get('.grid2')
      .find('.slick-sort-indicator-asc')
      .should('have.length', 1)
      .siblings('.slick-sort-indicator-numbered')
      .contains('1');

    cy.get('.grid2')
      .find('.slick-sort-indicator-desc')
      .should('have.length', 1)
      .siblings('.slick-sort-indicator-numbered')
      .contains('2');
  });

  it('should clear sorting of grid2 using the Grid Menu "Clear all Sorting" command', () => {
    cy.get('.grid2')
      .find('button.slick-gridmenu-button')
      .trigger('click')
      .click();
  });

  it('should have no sorting in 2nd grid (back to default sorted by id)', () => {
    let gridUid = '';

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-item:nth(1)')
          .find('span')
          .contains('Clear all Sorting')
          .click();

        cy.get('.grid2')
          .find('.slick-sort-indicator-asc')
          .should('have.length', 0);

        cy.get('.grid2')
          .find('.slick-sort-indicator-desc')
          .should('have.length', 0);

        cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', 'Task 23');
        cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0)`).should('contain', 'Task 24');
        cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(0)`).should('contain', 'Task 25');
        cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0)`).should('contain', 'Task 26');
        cy.get(`.grid2 [style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(0)`).should('contain', 'Task 27');
      });
  });

  it('should retain sorting in 1st grid', () => {
    cy.get('.grid1')
      .find('.slick-sort-indicator-desc')
      .should('have.length', 1);
  });

  it('should have Pagination displayed and set on Grid2', () => {
    cy.get('[data-test=page-number-input]')
      .invoke('val')
      .then(pageNumber => expect(pageNumber).to.eq('2'));

    cy.get('[data-test=page-count]')
      .contains('55');

    cy.get('[data-test=item-from]')
      .contains('6');

    cy.get('[data-test=item-to]')
      .contains('10');

    cy.get('[data-test=total-items]')
      .contains('271');
  });

  it('should clear filters of grid2 using the Grid Menu "Clear all Filters" command', () => {
    cy.get('.grid2')
      .find('button.slick-gridmenu-button')
      .trigger('click')
      .click();

    let gridUid = '';

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-item:nth(0)')
          .find('span')
          .contains('Clear all Filters')
          .click();
      });
  });

  it('should change Page Number 52 and expect the Pagination to have correct values', () => {
    cy.get('[data-test=page-number-input]')
      .clear()
      .type('52')
      .type('{enter}');

    cy.get('[data-test=page-count]')
      .contains('199');

    cy.get('[data-test=item-from]')
      .contains('256');

    cy.get('[data-test=item-to]')
      .contains('260');

    cy.get('[data-test=total-items]')
      .contains('995');
  });

  it('should open the Grid Menu on 1st Grid and expect all Columns to be checked', () => {
    let gridUid = '';
    cy.get('.grid1')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.get('.grid1 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              expect($input.attr('checked')).to.eq('checked');
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should then hide "Title" column from same 1st Grid and expect the column to be removed from 1st Grid', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];
    cy.get('.grid1')
      .get('.slick-gridmenu:visible')
      .find('.slick-gridmenu-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid1')
      .get('.slick-gridmenu:visible')
      .find('span.close')
      .click({ force: true });

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open the Grid Menu off 2nd Grid and expect all Columns to still be all checked', () => {
    let gridUid = '';
    cy.get('.grid2')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              expect($input.attr('checked')).to.eq('checked');
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should then hide "% Complete" column from this same 2nd Grid and expect the column to be removed from 2nd Grid', () => {
    const newColumnList = ['Title', 'Duration (days)', 'Start', 'Finish', 'Effort Driven'];
    cy.get('.grid2')
      .get('.slick-gridmenu:visible')
      .find('.slick-gridmenu-list')
      .children('li:visible:nth(2)')
      .children('label')
      .should('contain', '% Complete')
      .click({ force: true });

    cy.get('.grid2')
      .get('.slick-gridmenu:visible')
      .find('span.close')
      .click({ force: true });

    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should go back to 1st Grid and open its Grid Menu and we expect this grid to stil have the "Title" column be hidden (unchecked)', () => {
    cy.get('.grid1')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.get('.slick-gridmenu-list')
      .children('li')
      .each(($child, index) => {
        if (index <= 5) {
          const $input = $child.children('input');
          const $label = $child.children('label');
          if ($label.text() === 'Title') {
            expect($input.attr('checked')).to.eq(undefined);
          } else {
            expect($input.attr('checked')).to.eq('checked');
          }
          expect($label.text()).to.eq(fullTitles[index]);
        }
      });
  });

  it('should hide "Start" column from 1st Grid and expect to have 2 hidden columns (Title, Start)', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Finish', 'Effort Driven'];
    cy.get('.grid1')
      .get('.slick-gridmenu:visible')
      .find('.slick-gridmenu-list')
      .children('li:visible:nth(3)')
      .children('label')
      .should('contain', 'Start')
      .click({ force: true });

    cy.get('.grid1')
      .get('.slick-gridmenu:visible')
      .find('span.close')
      .click({ force: true });

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open Column Picker of 2nd Grid and show the "% Complete" column back to visible', () => {
    cy.get('.grid2')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .trigger('contextmenu')
      .invoke('show');

    cy.get('.slick-columnpicker')
      .find('.slick-columnpicker-list')
      .children()
      .each(($child, index) => {
        if (index <= 5) {
          expect($child.text()).to.eq(fullTitles[index]);
        }
      });

    cy.get('.slick-columnpicker')
      .find('.slick-columnpicker-list')
      .children('li:nth-child(3)')
      .children('label')
      .should('contain', '% Complete')
      .click();

    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => {
        if (index <= 5) {
          expect($child.text()).to.eq(fullTitles[index]);
        }
      });

    cy.get('.grid2')
      .get('.slick-columnpicker:visible')
      .find('span.close')
      .trigger('click')
      .click();
  });

  it('should open the Grid Menu on 2nd Grid and expect all Columns to be checked', () => {
    let gridUid = '';
    cy.get('.grid2')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              expect($input.attr('checked')).to.eq('checked');
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should still expect 1st Grid to be unchanged from previous state and still have only 4 columns shown', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Finish', 'Effort Driven'];

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open the Grid Menu on 1st Grid and also expect to only have 4 columns checked (visible)', () => {
    let gridUid = '';
    cy.get('.grid1')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.get('.grid1 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find(className => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-gridmenu.${gridUid}`)
          .find('.slick-gridmenu-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              if ($label.text() === 'Title' || $label.text() === 'Start') {
                expect($input.attr('checked')).to.eq(undefined);
              } else {
                expect($input.attr('checked')).to.eq('checked');
              }
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });

    cy.get('.grid1')
      .get('.slick-gridmenu:visible')
      .find('span.close')
      .click({ force: true });
  });
});
