import os

file_path = os.path.join('frontend', 'src', 'pages', 'Admin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Inventory Hub Add Item handler
old_add_handler = """                          onClick={() => {
                            setProductDraft(blankProduct);
                            setProductModalMode('all');
                            setDetailedVariants([]);
                            setShowProductModal(true);
                          }}"""

new_add_handler = """                          onClick={() => {
                            setProductDraft({ ...blankProduct, isPublished: false });
                            setProductModalMode('inventory');
                            setDetailedVariants([]);
                            setShowProductModal(true);
                          }}"""

code = code.replace(old_add_handler, new_add_handler, 1)

# 2. Add status pill tag under item details in Inventory Hub table
old_span = "{item.brand ? `${item.brand} · ` : ''}{item.weight}{item.unit}\n                                 </span>"
new_span = """{item.brand ? `${item.brand} · ` : ''}{item.weight}{item.unit}
                                 </span>
                                 <span style={{
                                   fontSize: '10px', fontWeight: 700, display: 'inline-block', marginTop: '3px',
                                   padding: '1px 7px', borderRadius: '20px',
                                   background: isPublished ? '#DCFCE7' : '#FEF3C7',
                                   color: isPublished ? '#166534' : '#92400E'
                                 }}>
                                   {isPublished ? '🟢 Live on Website' : '🟡 Inventory Only'}
                                 </span>"""

code = code.replace(old_span, new_span, 1)

# 3. Add Upload/Remove button next to Update Stock button in Inventory Hub table
old_btn = """                              <button
                                className="admin__primary"
                                style={{ height: '32px', padding: '0 12px', fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => {
                                  setAdjustModalItem(item);
                                  setAdjustForm({
                                    changeType: 'ADD',
                                    quantity: '',
                                    targetField: 'availableStock',
                                    reason: 'Purchase / New Stock Received',
                                    notes: ''
                                  });
                                }}
                              >
                                Update Stock
                              </button>"""

new_btn = """                              <button
                                className="admin__primary"
                                style={{ height: '32px', padding: '0 12px', fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => {
                                  setAdjustModalItem(item);
                                  setAdjustForm({
                                    changeType: 'ADD',
                                    quantity: '',
                                    targetField: 'availableStock',
                                    reason: 'Purchase / New Stock Received',
                                    notes: ''
                                  });
                                }}
                              >
                                Update Stock
                              </button>
                              <button
                                style={{
                                  height: '32px', padding: '0 10px', fontSize: '11px', borderRadius: '6px',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  background: isPublished ? '#FEF3C7' : '#DCFCE7',
                                  color: isPublished ? '#92400E' : '#166534',
                                  border: `1px solid ${isPublished ? '#FCD34D' : '#86EFAC'}`,
                                  cursor: 'pointer', fontWeight: 600
                                }}
                                title={isPublished ? 'Remove from website' : 'Upload to website'}
                                onClick={() => {
                                  const target = dbProd
                                    ? { ...dbProd, isPublished }
                                    : { id: item.productId, name: item.name, isPublished };
                                  togglePublishProduct(target);
                                }}
                              >
                                {isPublished ? '🌐 Remove from Website' : '🌐 Upload to Website'}
                              </button>"""

code = code.replace(old_btn, new_btn, 1)

# 4. Add yellow Status Card in Product Modal for Inventory Hub mode
old_modal_footer = """                  <div className="inventory-modal__footer">
                    <button type="button" className="admin__ghost" onClick={() => setShowProductModal(false)}>Cancel</button>"""

new_modal_card = """                  {/* Status toggle card — shown when adding/editing item in Inventory Hub */}
                  {(productModalMode === 'inventory' || activeTab === 'inventory') && (
                    <div style={{
                      background: productDraft.isPublished ? '#F0FDF4' : '#FFFBEB',
                      border: `2px solid ${productDraft.isPublished ? '#86EFAC' : '#FCD34D'}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: productDraft.isPublished ? '#166534' : '#92400E' }}>
                          {productDraft.isPublished ? '🟢 Upload to Website' : '🟡 Inventory Only'}
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#687466' }}>
                          {productDraft.isPublished
                            ? 'This item will be visible to customers on the website after saving.'
                            : 'This item will be saved to inventory only. Customers won\'t see it yet.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          style={{
                            padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            border: '2px solid #86EFAC',
                            background: productDraft.isPublished ? '#16A34A' : 'transparent',
                            color: productDraft.isPublished ? '#fff' : '#16A34A',
                            cursor: 'pointer'
                          }}
                          onClick={() => setProductDraft(prev => ({ ...prev, isPublished: true }))}
                        >
                          ✅ Yes, Upload
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            border: '2px solid #FCD34D',
                            background: !productDraft.isPublished ? '#D97706' : 'transparent',
                            color: !productDraft.isPublished ? '#fff' : '#92400E',
                            cursor: 'pointer'
                          }}
                          onClick={() => setProductDraft(prev => ({ ...prev, isPublished: false }))}
                        >
                          📦 No, Keep in Inventory
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="inventory-modal__footer">
                    <button type="button" className="admin__ghost" onClick={() => setShowProductModal(false)}>Cancel</button>"""

code = code.replace(old_modal_footer, new_modal_card, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print('Targeted Inventory Hub patch applied successfully!')
