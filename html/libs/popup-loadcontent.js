document.addEventListener('DOMContentLoaded', function() {
	// Tab 2
	var a = new Vue({
	  el: '#birthdayData',  
	  render(h) {
		const vm = this;
		const tableRows = vm.items.map(row =>
            h('tr', [
              h('td', row.col1),
              h('td', row.col2),
              h('td', row.col3),
              h('td', row.col4),
            ])
          );

		  return h('table', {"class": "table table-bordered table-hover"}, [
            h('thead', [
              h('tr', [
                h('th', 'Cột 1'),
                h('th', 'Cột 2'),
                h('th', 'Cột 3'),
                h('th', 'Cột 4'),
              ])
            ]),
            h('tbody', tableRows)
          ]);
	  },
	  data: {
		items: [
			{ col1: 'Dữ liệu 1', col2: 'Dữ liệu 2', col3: 'Dữ liệu 3', col4: 'Dữ liệu 3'},
            { col1: 'Dữ liệu 4', col2: 'Dữ liệu 5', col3: 'Dữ liệu 6', col4: 'Dữ liệu 3'},
            { col1: 'Dữ liệu 7', col2: 'Dữ liệu 8', col3: 'Dữ liệu 9', col4: 'Dữ liệu 3'}
		]
	  },
	});

	// Tab 3
	popupFeature()

	var mapQC = new Vue({
		el: '#vue-map-qc',
		data: {
		  formFields: [
			{ label: 'Comment', idResource: 'comment-resource', placeholderResource: 'Excel', idDes: 'comment-des', placeholderDes: 'QC' },
			{ label: 'Function', idResource: 'function-resource', placeholderResource: 'Excel', idDes: 'function-des', placeholderDes: 'QC' },
			{ label: 'Hour', idResource: 'hour-resource', placeholderResource: 'Excel', idDes: 'hour-des', placeholderDes: 'QC' },
			{ label: 'Phase', idResource: 'phase-resource', placeholderResource: 'Excel', idDes: 'phase-des', placeholderDes: 'QC' }
		  ]
		},
		render(h) {
		  const vm = this;
	
		  // Tạo các hàng cho từng trường
		  const rows = vm.formFields.map(field => 
			h('div', { class: 'row mb-3' }, [
			  h('label', { class: 'col-sm-4 col-form-label' }, field.label),
			  h('div', { class: 'col-sm-3' }, [
				h('input', { 
				  attrs: { id: field.idResource, placeholder: field.placeholderResource },
				  class: 'form-control'
				})
			  ]),
			  h('div', { class: 'col-sm-3' }, [
				h('input', { 
				  attrs: { id: field.idDes, placeholder: field.placeholderDes },
				  class: 'form-control'
				})
			  ])
			])
		  );
	
		  // Nút lưu
		  const saveButton = h('button', { 
			class: 'btn btn-primary', 
			attrs: { type: 'button', id: 'fnSaveMapping' } 
		  }, [
			h('i', { class: 'fa fa-save' })
		  ]);
	
		  return h('div', [ ...rows, saveButton ]);
		}
	  });

});

function popupFeature() {
  const dataFeature = [
    {name: 'category'},
    {name: 'ticket'},
    {name: 'title'},
    {name: 'feature'},
    {name: 'feature2'}
  ];

  new Vue({
    el: '#vue-import-feature',
    data: {
      formFields: this.dataFeature,
      checkbox: { id: 'gridCheck', label: 'Remember' },
      alert: { message: 'Success!', class: 'alert-success' }
    },
    render(h) {
      const vm = this;

      const formElements = vm.formFields.map(field => 
        h('div', { class: 'col-md-12' }, [
          h('div', { class: 'form-group' }, [
            h('input', { 
              attrs: { 
                type: "text", 
                id: field.name, 
                placeholder: field.name 
              },
              class: "form-control"
            })
          ])
        ])
      );

      const checkboxElement = h('div', { class: 'col-md-12' }, [
        h('div', { class: 'form-group' }, [
          h('div', { class: 'form-check' }, [
            h('input', { 
              attrs: { type: 'checkbox', id: vm.checkbox.id },
              class: 'form-check-input'
            }),
            h('label', { 
              attrs: { for: vm.checkbox.id },
              class: 'form-check-label' 
            }, vm.checkbox.label)
          ])
        ])
      ]);

      const buttonElement = h('div', { class: 'col-md-3' }, [
        h('button', { class: 'btn btn-primary', 
          attrs: { type: 'button', id: 'fnSaveFeature' }}, [
          h('i', { class: 'fa fa-save' })
        ])
      ]);

      const alertElement = h('div', { 
        class: `alert ${vm.alert.class} alert-dismissible col-md-5`, 
        attrs: { role: 'alert', id: 'alert-add-feature'},
        style: { padding: '6px', margin: '0' }
      }, [
        h('button', { 
          class: 'close', 
          attrs: { type: 'button', 'data-dismiss': 'alert', 'aria-label': 'Close' },
          style: { padding: '5px' }
        }, [
          h('span', { attrs: { 'aria-hidden': 'true' } }, 'x')
        ]),
        h('strong', vm.alert.message)
      ]);

      return h('div', { class: 'row' }, [
        ...formElements,
        checkboxElement,
        h('div', { class: 'row' }, [
          buttonElement,
          alertElement
        ])
      ]);
    }
});
}