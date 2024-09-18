const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('catalog promotions', () => {
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('firefox').build();
  });

  after(async () => {
    await driver.quit();
  });

  beforeEach(async () => {
    driver.manage().deleteAllCookies();
    await driver.get('http://localhost:9990/admin');
    // await driver.get('http://150.165.75.99:9990/admin');
    await driver.findElement(By.id('_username')).sendKeys('sylius');
    await driver.findElement(By.id('_password')).sendKeys('sylius');
    await driver.findElement(By.css('.primary')).click();
    // await driver.sleep(1000);
  });

  // Remove .only and implement others test cases!
  it.skip('shows of especify catalog promotion exposes the correct product and discount', async () => {
    // Click in catalog promotions in side menu
    await driver.findElement(By.linkText('Catalog promotions')).click();

    // Select inactive promotions in search tab
    const dropdown = await driver.findElement(By.id('criteria_state'));
    await dropdown.findElement(By.xpath("//option[. = 'Inactive']")).click();

    // Type in value input to search for specify catalog promotion
    await driver.findElement(By.id('criteria_search_value')).sendKeys('autumn');

    // Click in filter blue button
    await driver.findElement(By.css('*[class^="ui blue labeled icon button"]')).click();

    // Click in details of the remain catalog promotion
    const buttons = await driver.findElements(By.css('*[class^="ui labeled icon button "]'));
    await buttons[1].click();

    // Assert that details page is listing all variants
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    assert(bodyText.includes('Knitted_wool_blend_green_cap'));
    assert(bodyText.includes('Percentage discount'));
    assert(bodyText.includes('50%'));
  });


//TESTE 1
it.skip('allows the user to create a new catalog promotion', async () => {
  // Navegar para a página de promoções de catálogo
  await driver.get('http://localhost:9990/admin/catalog-promotions/');
  
  // Pausar para verificar o carregamento
  await driver.sleep(2000);

  // Esperar pelo botão "Create"
  let createButton = await driver.findElement(By.css('a.ui.labeled.icon.button.primary'));
  await driver.wait(until.elementIsVisible(createButton), 10000);
  await createButton.click();


  // Preencher o formulário
  const uniqueCode = `Teste_${Date.now()}`;
  await driver.findElement(By.id('sylius_catalog_promotion_code')).sendKeys(uniqueCode);
  await driver.findElement(By.id('sylius_catalog_promotion_name')).sendKeys(`Promoção ${uniqueCode}`);
  await driver.findElement(By.id('sylius_catalog_promotion_translations_en_US_description')).sendKeys('Description of the new promotion');

  // Preencher a data e a hora
  await driver.findElement(By.id('sylius_catalog_promotion_endDate_date')).sendKeys('2024-09-30');
  const timeInput = await driver.findElement(By.id('sylius_catalog_promotion_endDate_time'));
  await timeInput.sendKeys('01:52:08');


  // Clicar no botão "Create"
  await driver.findElement(By.css('.primary')).click();

  // Verificar se a promoção foi criada
  const bodyText = await driver.findElement(By.tagName('body')).getText();
  assert(bodyText.includes('Catalog promotion has been successfully created.'));
  
  // Extrair o ID da promoção da URL
  const currentUrl = await driver.getCurrentUrl();
  const promotionId = currentUrl.split('/').slice(-2, -1)[0];
  console.log('Created Promotion ID: ', promotionId);

  // Armazenar o ID em um arquivo JSON
  fs.writeFileSync('promotionId.json', JSON.stringify({ id: promotionId }));

  });


  //Teste 2
  it.skip('allows the user to edit an existing catalog promotion', async () => {
    // Carregar o ID da promoção do arquivo JSON
    const promotionData = JSON.parse(fs.readFileSync('promotionId.json'));
    const promotionId = promotionData.id;

    // Navegar para a página de edição da promoção
    await driver.get(`http://localhost:9990/admin/catalog-promotions/${promotionId}/edit`);

    // Pausar para carregar a página de edição
    await driver.sleep(2000);

    // Limpar e modificar o campo "Name"
    const nameField = await driver.findElement(By.id('sylius_catalog_promotion_name'));
    await nameField.clear();
    
    // Verificar o nome atual para evitar conflitos
    const currentName = await nameField.getAttribute('value');
    let newName = 'Updated Promotion Name';
    if (currentName === newName) {
      newName += '_v2'; // Adicionar uma versão para evitar nome duplicado
    }
    
    await nameField.sendKeys(newName);

    // Clicar no botão "Save changes"
    const saveButton = await driver.findElement(By.id('sylius_save_changes_button'));
    await saveButton.click();

    // Pausar para aguardar o salvamento
    await driver.sleep(2000);

    // Verificar se a mensagem de sucesso apareceu
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    assert(bodyText.includes('Catalog promotion has been successfully updated.'));
    
    // Atualizar o arquivo JSON com o novo nome para evitar conflitos futuros
    promotionData.name = newName;
    fs.writeFileSync('promotionId.json', JSON.stringify(promotionData));

    console.log(`Promotion ${promotionId} updated to name: ${newName}`);
  });

  //Teste 3
  it.skip('allows the user to delete a catalog promotion', async () => {
    // Carregar o ID da promoção do arquivo JSON
    const promotionData = JSON.parse(fs.readFileSync('promotionId.json'));
    const promotionId = promotionData.id;

    // Navegar para a página de promoções de catálogo
    await driver.get('http://localhost:9990/admin/catalog-promotions/');

    // Pausar para garantir o carregamento da página
    await driver.sleep(2000);

    // Localizar a linha correspondente à promoção e clicar no botão de exclusão
    const promotionRow = await driver.findElement(By.xpath(`//td[contains(text(), '${promotionId}')]/..`));
    const deleteButton = await promotionRow.findElement(By.css('button[type="submit"]'));
    await deleteButton.click();

    // Aguardar o modal de confirmação e clicar no botão "Yes"
    const confirmButton = await driver.wait(until.elementLocated(By.id('confirmation-button')), 5000);
    await confirmButton.click();

    // Verificar se a mensagem de sucesso é exibida após a exclusão
    const successMessage = await driver.wait(until.elementLocated(By.css('.ui.icon.positive.message.sylius-flash-message')), 10000);
    const messageText = await successMessage.getText();
    
    assert(messageText.includes('Success'));
    assert(messageText.includes('Removing of catalog promotion has been requested. This process can take a while depending on the number of affected products.'));

    console.log(`Promotion ${promotionId} deleted successfully.`);
  });

  //TESTE 4
  it.skip('allows the user to cancel the editing of a catalog promotion', async () => {
    // Carregar o ID da promoção do arquivo JSON
    const promotionData = JSON.parse(fs.readFileSync('promotionId.json'));
    const promotionId = promotionData.id;

    // Navegar para a página de edição da promoção
    await driver.get(`http://localhost:9990/admin/catalog-promotions/${promotionId}/edit`);

    // Pausar para garantir o carregamento da página
    await driver.sleep(2000);

    // Modificar o campo do nome
    const nameField = await driver.findElement(By.id('sylius_catalog_promotion_name'));
    await nameField.clear();
    await nameField.sendKeys('Temporary Name');

    // Clicar no botão "Cancel" para cancelar as alterações
    const cancelButton = await driver.findElement(By.xpath("//a[contains(@class, 'ui button') and contains(text(), 'Cancel')]"));
    await cancelButton.click();

    // Verificar se o URL retornou à lista de promoções
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('/admin/catalog-promotions/'), 'The URL does not include /admin/catalog-promotions/');
    
    console.log('Successfully canceled the editing and returned to the promotions list.');
  });

  //TESTE 5
  it.skip('should show validation errors if catalog promotion code and name are missing', async () => {
    // Navegar para a página de promoções de catálogo
    await driver.get('http://localhost:9990/admin/catalog-promotions/');
    
    // Esperar pelo botão "Create" e clicar
    const createButton = await driver.findElement(By.css('a.ui.labeled.icon.button.primary'));
    await driver.wait(until.elementIsVisible(createButton), 10000);
    await createButton.click();

    // Pausar para garantir o carregamento da página de criação
    await driver.sleep(2000);

    // Preencher apenas a descrição, omitindo o código e o nome da promoção
    await driver.findElement(By.id('sylius_catalog_promotion_translations_en_US_description')).sendKeys('Description of the promotion');

    // Definir a data e hora
    await driver.findElement(By.id('sylius_catalog_promotion_endDate_date')).sendKeys('2024-09-16');
    const timeInput = await driver.findElement(By.id('sylius_catalog_promotion_endDate_time'));
    await timeInput.clear();
    await timeInput.sendKeys('01:52:08');

    // Tentar submeter o formulário sem preencher código e nome
    await driver.findElement(By.css('.primary')).click();

    // Pausar para permitir o carregamento da página de validação
    await driver.sleep(2000);

    // Verificar se as mensagens de erro para o código e nome da promoção são exibidas
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    assert(bodyText.includes('Please enter catalog promotion code.'), 'Validation error for promotion code is missing.');
    assert(bodyText.includes('Please enter catalog promotion name.'), 'Validation error for promotion name is missing.');

    console.log('Validation errors for missing code and name are correctly displayed.');
  });

  //TESTE 6 - Ainda tenho que fazer funcionar
  it.skip('should allow the user to view details of a catalog promotion', async () => {
    // Carregar o ID da promoção do arquivo fixture
    const data = JSON.parse(fs.readFileSync('selenium/fixtures/promotionId.json'));
    const promotionId = data.id;
    console.log('Promotion ID from fixture:', promotionId);

    // Navegar para a página de promoções
    await driver.get('http://localhost:9990/admin/catalog-promotions/');
    
    // Verificar se o ID da promoção está visível na tabela
    const promotionElement = await driver.findElement(By.xpath(`//td[contains(text(), "${promotionId}")]`));
    await driver.wait(until.elementIsVisible(promotionElement), 10000);
    assert(await promotionElement.isDisplayed(), 'Promotion ID is not visible in the table.');

    // Localizar e clicar diretamente no botão "Show" para visualizar detalhes
    const showButton = await driver.findElement(By.css(`a.ui.labeled.icon.button[href="/admin/catalog-promotions/${promotionId}"]`));
    await showButton.click();

    // Verificar se a URL foi corretamente redirecionada
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes(`/admin/catalog-promotions/${promotionId}`), 'URL does not contain the promotion ID.');

    // Verificar os detalhes da promoção: código e nome
    const codeRow = await driver.findElement(By.xpath("//tr[th[contains(text(), 'Code')]]/td"));
    const nameRow = await driver.findElement(By.xpath("//tr[th[contains(text(), 'Name')]]/td"));

    assert((await codeRow.getText()).includes('Teste_7'), 'Promotion code is incorrect.');
    assert((await nameRow.getText()).includes('Updated Promotion Name'), 'Promotion name is incorrect.');

    console.log('Promotion details are correctly displayed.');
  });

  //TESTE 7
  it.skip('should filter promotions by code and update the URL accordingly', async () => {
    // Navegar para a página de promoções
    await driver.get('http://localhost:9990/admin/catalog-promotions/');
  
    // Aguardar que o dropdown de filtro esteja visível
    const filterDropdown = await driver.findElement(By.css('.title'));
    await driver.wait(until.elementIsVisible(filterDropdown), 10000);
  
    // Verificar se o formulário de filtro já está visível
    let filterFormVisible = false;
    try {
      const filterForm = await driver.findElement(By.css('.content.active'));
      filterFormVisible = true;
    } catch (e) {
      // O formulário não está visível, então precisamos clicar no botão de filtro
      const isDropdownOpen = await driver.findElement(By.css('.content')).isDisplayed();
      if (!isDropdownOpen) {
        await filterDropdown.click();
      }
    }
  
    // Agora verificar se o formulário de filtro está visível
    const filterForm = await driver.findElement(By.css('.content.active'));
    await driver.wait(until.elementIsVisible(filterForm), 10000);
  
    // Verificar se o campo de busca está visível
    const searchField = await driver.findElement(By.id('criteria_search_value'));
    await driver.wait(until.elementIsVisible(searchField), 10000);
  
    // Preencher o campo de busca com um valor
    await searchField.sendKeys('Teste_7');
  
    // Clicar no botão de filtro
    const filterButton = await driver.findElement(By.css('.ui.blue.labeled.icon.button[type="submit"]'));
    await filterButton.click();
  
    // Esperar até que a URL seja atualizada
    await driver.wait(async function() {
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl.includes('criteria%5Bsearch%5D%5Bvalue%5D=Teste_7');
    }, 20000); // Aumentar o tempo de espera se necessário
  
    // Verificar se a tabela exibe os resultados filtrados
    const table = await driver.findElement(By.css('table'));
    const tableText = await table.getText();
    assert(tableText.includes('Teste_7'), 'Filtered results do not contain "Teste_7"');
  });

  //TESTE 8 - Ainda precisso consertar
  it.skip('should display a no results message when there are no matching promotions', async () => {
    // Navegar para a página de promoções
    await driver.get('http://localhost:9990/admin/catalog-promotions/');
  
    // Clicar no dropdown de filtro se não estiver já aberto
    const filterDropdown = await driver.findElement(By.css('.title'));
    let isFilterFormVisible = await driver.findElements(By.css('.content.active')).length > 0;
    
    if (!isFilterFormVisible) {
      await filterDropdown.click();
      // Aguarde até que o formulário de filtro esteja visível
      await driver.wait(until.elementLocated(By.css('.content.active')), 10000);
    }
  
    // Recarregar o elemento do formulário de filtro
    const filterForm = await driver.findElement(By.css('.content.active'));
    await driver.wait(until.elementIsVisible(filterForm), 10000);
  
    // Recarregar o elemento do campo de busca
    const searchField = await driver.findElement(By.id('criteria_search_value'));
    await driver.wait(until.elementIsVisible(searchField), 10000);
  
    // Preencher o campo de busca com um valor que não retorna resultados
    await searchField.sendKeys('NenhumResultado');
  
    // Recarregar o elemento do botão de filtro
    const filterButton = await driver.findElement(By.css('.ui.blue.labeled.icon.button[type="submit"]'));
    await filterButton.click();
  
    // Recarregar o elemento da mensagem de "nenhum resultado"
    const noResultsMessage = await driver.findElement(By.css('.content'));
    await driver.wait(until.elementTextContains(noResultsMessage, 'There are no results to display'), 10000);
  
    // Verificar se a mensagem "There are no results to display" aparece
    const messageText = await noResultsMessage.getText();
    assert(messageText.includes('There are no results to display'), 'No results message is not displayed');
  });

  //Teste 9 - Também ainda está quebrado
  it('should filter promotions by enabled status', async () => {
    // Acessar a página de promoções
    await driver.get('http://localhost:9990/admin/catalog-promotions/');
  
    // Localizar o botão de filtros
    const filtersButton = await driver.findElement(By.css('.title'));
  
    // Verificar se o painel de filtros está visível
    let isFiltersVisible = false;
    try {
      const filtersForm = await driver.findElement(By.css('.ui.loadable.form.transition'));
      isFiltersVisible = await filtersForm.isDisplayed();
    } catch (error) {
      // O painel de filtros não foi encontrado, o botão precisa ser clicado
      console.log('Filters form is not visible, opening filters.');
    }
  
    if (!isFiltersVisible) {
      // Abrir o painel de filtros se ele não estiver visível
      await filtersButton.click();
    }
  
    // Aguardar até que o formulário de filtros seja visível
    const filtersForm = await driver.findElement(By.css('.ui.loadable.form.transition'));
    await driver.wait(until.elementIsVisible(filtersForm), 10000);
  
    // Selecionar a opção "Yes" para o campo "Enabled"
    const enabledDropdown = await driver.findElement(By.id('criteria_enabled'));
    await enabledDropdown.sendKeys('true');  // Seleciona a opção "true"
  
    // Forçar o clique no botão "Filter" para aplicar o filtro
    const filterButton = await driver.findElement(By.css('.ui.blue.labeled.icon.button'));
    await filterButton.click();
  
    // Verificar se a URL contém o valor do filtro de "enabled"
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('criteria%5Benabled%5D=true'), 'URL does not contain the enabled filter parameter.');
  
    // Verificar se há pelo menos uma promoção listada
    const rows = await driver.findElements(By.css('table tbody tr'));
    assert(rows.length > 0, 'No promotions are listed.');
  
    // Verificar que a mensagem de "nenhum resultado" não é exibida
    const content = await driver.findElement(By.css('.content'));
    const contentText = await content.getText();
    assert(!contentText.includes('There are no results to display'), 'No results message is displayed.');
  });

  // Implement the remaining test cases in a similar manner
});
