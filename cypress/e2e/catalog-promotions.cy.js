describe('catalog promotions', () => {
  beforeEach(() => {
    cy.visit('/admin');
    cy.get('[id="_username"]').type('sylius');
    cy.get('[id="_password"]').type('sylius');
    cy.get('.primary').click();
  });
  // Remove .only and implement others test cases!
  it('shows of especify catalog promotion exposes the correct product and discount', () => {
    // Click in catalog promotions in side menu
    cy.clickInFirst('a[href="/admin/catalog-promotions/"]');
    // Select inactive promotions in search tab
    cy.get('[id="criteria_state"]').select('Inactive');
    // Type in value input to search for specify catalog promotion
    cy.get('[id="criteria_search_value"]').type('autumn');
    // Click in filter blue button
    cy.get('*[class^="ui blue labeled icon button"]').click();
    // Click in shows of the remain catalog promotion
    cy.get('*[class^="ui labeled icon button "]').each(($btn, index) => {
      if (index == 1) cy.wrap($btn).click();
    });

    // Assert that shows page has important informations
    cy.get('body').should('contain', 'Knitted_wool_blend_green_cap').and('contain', 'Percentage discount').and('contain', '50%');

  });

  // TESTE 1
  it('allows the user to create a new catalog promotion', () => {
    // Click on "Catalog Promotions" in the side menu
    cy.clickInFirst('a[href="/admin/catalog-promotions/"]');
    
    // Wait for the page to load and check for the existence of the "Create" button
    cy.get('a.ui.labeled.icon.button.primary', { timeout: 10000 }).should('be.visible').click();
    
    // Fill out the catalog promotion form
    cy.get('[id="sylius_catalog_promotion_code"]').type('Teste_7');
    cy.get('[id="sylius_catalog_promotion_name"]').type('Teste 7');
    cy.get('[id="sylius_catalog_promotion_translations_en_US_description"]').type('Description of the new promotion');

    // Set the date value
    cy.get('[id="sylius_catalog_promotion_endDate_date"]').type('2024-09-16');

    // Set the time value
    cy.get('[id="sylius_catalog_promotion_endDate_time"]').invoke('val', '01:52:08').trigger('change');
    
    // Click on the "Create" button
    cy.get('.primary').click();
    
    // Verify that the promotion was created successfully
    cy.get('body').should('contain', 'Catalog promotion has been successfully created.');

    cy.url().then((url) => {
      // Supondo que o ID está na URL após a criação, por exemplo, /admin/catalog-promotions/123/edit
      const promotionId = url.split('/').slice(-2, -1)[0];
      cy.log('Created Promotion ID: ', promotionId);
  
      // Armazene o ID em um arquivo de configuração ou variável global
      cy.writeFile('cypress/fixtures/promotionId.json', { id: promotionId });
    });
  });

  // TESTE 2
  it('allows the user to edit an existing catalog promotion', () => {
    // Carregar o ID da promoção do arquivo de configuração
    cy.readFile('cypress/fixtures/promotionId.json').then((data) => {
      const promotionId = data.id;
  
      // Navegar para a página de edição da promoção
      cy.visit(`/admin/catalog-promotions/${promotionId}/edit`);
  
      // Modificar o campo do nome
      cy.get('[id="sylius_catalog_promotion_name"]').clear().type('Updated Promotion Name');
  
      // Salvar as alterações
      cy.get('[id="sylius_save_changes_button"]').click();
  
      // Verifique se a edição foi salva com sucesso
      cy.get('body').should('contain', 'Catalog promotion has been successfully updated.');
    });
  });  


  // // TESTE 3
  it('allows the user to delete a catalog promotion', () => {
    // Carregue o ID da promoção do arquivo de fixture
    cy.readFile('cypress/fixtures/promotionId.json').then((data) => {
      const promotionId = data.id;

      // Visite a página de promoções
      cy.visit('/admin/catalog-promotions/');

      // Encontre e clique no botão de exclusão da promoção com o ID carregado
      cy.contains('td', promotionId) // Encontre a célula que contém o código da promoção
        .parent() // Pega a linha (tr) correspondente ao código
        .within(() => {
          // Encontre e clique no botão de exclusão
          cy.get('form').within(() => {
            cy.get('button[type="submit"]').click(); // Clique no botão de exclusão
          });
        });

      // Aguarde a confirmação de exclusão e clique no botão "Yes"
      cy.get('#confirmation-button').click();

      // Verifique se a mensagem de sucesso aparece após a confirmação
      cy.get('.ui.icon.positive.message.sylius-flash-message')
        .should('be.visible')
        .within(() => {
          cy.get('.header').should('contain.text', 'Success');
          cy.get('p').should('contain.text', 'Removing of catalog promotion has been requested. This process can take a while depending on the number of affected products.');
        });
    });
  });
  
  // TESTE 4
  it('allows the user to cancel the editing of a catalog promotion', () => {
    // Carregar o ID da promoção do arquivo de configuração
    cy.readFile('cypress/fixtures/promotionId.json').then((data) => {
      const promotionId = data.id;
    
      // Navegar para a página de edição da promoção
      cy.visit(`/admin/catalog-promotions/${promotionId}/edit`);
    
      // Modificar o campo do nome
      cy.get('[id="sylius_catalog_promotion_name"]').clear().type('Temporary Name');
    
      // Cancelar as alterações
      cy.get('a.ui.button').contains('Cancel').click();
    
      // Verifique se você retornou à lista de promoções
      cy.url().should('include', '/admin/catalog-promotions/');
    });
  });

  // TESTE 5
  it('should show validation errors if catalog promotion code and name are missing', () => {
    // Navegar para a página de criação de uma nova promoção
    cy.get('a[href="/admin/catalog-promotions/"]').click();
    cy.get('a.ui.labeled.icon.button.primary').click(); // Clica no botão "Create"

    // Preencher apenas alguns campos do formulário, omitindo o código e o nome da promoção
    // Aqui apenas preenche a descrição, data e hora como exemplo
    cy.get('[id="sylius_catalog_promotion_translations_en_US_description"]').type('Description of the promotion');

    // Definir a data e hora (ou outras informações obrigatórias, se necessário)
    cy.get('[id="sylius_catalog_promotion_endDate_date"]').type('2024-09-16');
    cy.get('[id="sylius_catalog_promotion_endDate_time"]').invoke('val', '01:52:08').trigger('change');

    // Tentar submeter o formulário
    cy.get('.primary').click(); // Clica no botão "Save"

    // Verificar se as mensagens de erro para o código e nome da promoção são exibidas
    cy.get('.ui.red.pointing.label.sylius-validation-error')
      .should('contain.text', 'Please enter catalog promotion code.')
      .should('be.visible');
    
    cy.get('.ui.red.pointing.label.sylius-validation-error')
      .should('contain.text', 'Please enter catalog promotion name.')
      .should('be.visible');
    });

    // TESTE 6
    it('should allow the user to view details of a catalog promotion', () => {
      cy.readFile('cypress/fixtures/promotionId.json').then((data) => {
        const promotionId = data.id;
    
        cy.log('Promotion ID from fixture:', promotionId);
    
        // Navegar para a página de promoções
        cy.visit('/admin/catalog-promotions/');
    
        // Verificar se o ID da promoção está visível na tabela
        cy.contains('td', promotionId).should('exist');
    
        // Localizar e clicar diretamente no botão "Show"
        cy.get(`a.ui.labeled.icon.button[href="/admin/catalog-promotions/${promotionId}"]`).click();
    
        cy.url().should('include', `/admin/catalog-promotions/${promotionId}`);
    
        cy.contains('tr', 'Code').find('td').eq(1).should('contain', 'Teste_7');
        cy.contains('tr', 'Name').find('td').eq(1).should('contain', 'Updated Promotion Name');


      });
    });
    
    
    // TESTE 7

    it('should filter promotions by code and update the URL accordingly', () => {
      // Navegar para a página de promoções
      cy.visit('/admin/catalog-promotions/');

      // Clica no dropdown de filtro
      cy.get('.title').click();

      // Verifica se o formulário de filtro aparece
      cy.get('.content.active').should('be.visible');

      // Verifica se o campo de busca está visível
      cy.get('#criteria_search_value').should('be.visible');

      // Preenche o campo de busca com um valor
      cy.get('#criteria_search_value').type('Teste_7');

      // Clica no botão de filtro
      cy.get('.ui.blue.labeled.icon.button[type="submit"]').click({force: true});

      // Verifica se a URL contém o valor do filtro de busca
      cy.url().should('include', 'criteria%5Bsearch%5D%5Bvalue%5D=Teste_7');

      // Verifica se a tabela exibe os resultados filtrados
      cy.get('table').should('contain', 'Teste_7');
    });


    // TESTE 8
    it('It should display a no results message when there are no matching promotions', () => {
      // Acessa a página de promoções no admin
      cy.visit('/admin/catalog-promotions/');
  
      // Clica no dropdown de filtro
      cy.get('.title').click();
  
      // Verifica se o formulário de filtro aparece
      cy.get('.content.active').should('be.visible');
  
      // Verifica se o campo de busca está visível
      cy.get('#criteria_search_value').should('be.visible');
  
      // Preenche o campo de busca com um valor que não retorna resultados
      cy.get('#criteria_search_value').type('NenhumResultado');
  
      // Clica no botão de filtro usando { force: true }
      cy.get('.ui.blue.labeled.icon.button[type="submit"]').click({ force: true });
  
      // Verifica se a mensagem "There are no results to display" aparece
      cy.get('.content').should('contain', 'There are no results to display');
    });


    // TESTE 9

    it('should filter promotions by enabled status', () => {
      // Acessar a página de promoções
      cy.visit('/admin/catalog-promotions/');
      
      // Abrir o painel de filtros
      cy.get('.title').contains('Filters').click();
      
      // Aguardar até que o formulário de filtros seja visível
      cy.get('.ui.loadable.form.transition', { timeout: 10000 }).should('be.visible');
      
      // Selecionar a opção "Yes" para o campo "Enabled"
      cy.get('#criteria_enabled').select('true');
      
      // Forçar o clique no botão "Filter" para aplicar o filtro
      cy.get('.ui.blue.labeled.icon.button').click({ force: true });
      
      // Verificar se a URL contém o valor do filtro de "enabled"
      cy.url().should('include', 'criteria%5Benabled%5D=true');
      
      // Verificar se há pelo menos uma promoção listada
      cy.get('table tbody tr').should('have.length.greaterThan', 0);  // Supondo que as promoções estão listadas em linhas da tabela
      
      // Verificar que a mensagem de "nenhum resultado" não é exibida
      cy.get('.content').should('not.contain', 'There are no results to display');
    });

  
  
  

});
