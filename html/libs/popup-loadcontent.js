document.addEventListener('DOMContentLoaded', function() {
  // Tab 1
  popupHome()

	// Tab 2
	popupBirthDay()

	// Tab 3
	popupFormatQc()
	popupFeature()
	popupMapping()

});

function popupHome() {
  NOC_HIGHTLIGHT1.execute()

  const formData = {
    datas: NOC_HIGHTLIGHT1.getData()
  }

  new Vue({
	  el: '#homeData',
    data: formData,  
	  render(h) {
      const vm = this;
      const tableRows = vm.datas.map(row =>
        h('p', row.link)
      );

      return h('div', {
        style: {'max-height':'300px', 'overflow-x':'auto', 'font-size':'10px'}
      }, tableRows)
    },
	});
}

function popupBirthDay() {
  const formData = {
    datas: [
			{ col1: 'Name 1', col2: 'Birthday 1', col3: 'Team 3'},
      { col1: 'Name 4', col2: 'Birthday 5', col3: 'Team 6'},
      { col1: 'Name 7', col2: 'Birthday 8', col3: 'Team 9'}
		]
  }

  new Vue({
	  el: '#birthdayData',
    data: formData,  
	  render(h) {
		const vm = this;
		const tableRows = vm.datas.map(row =>
      h('tr', [
        h('td', row.col1),
        h('td', row.col2),
        h('td', row.col3),
      ])
    );

    return h('table', {"class": "table table-bordered table-hover"}, [
      h('thead', [
        h('tr', [
          h('th', 'Name'),
          h('th', 'Birthday'),
          h('th', 'Team')
        ])
      ]),
      h('tbody', tableRows)
    ]);
  },
	});
}

function popupFormatQc() {
  const formQc = {
    format: "thuys"
  }

  new Vue({
    el: '#vue-format-qc',
    data: formQc,
    render(h) {
      const vm = this;

      const input = h('div', { class: 'form-group col-sm-12' }, [
        h('input', { 
          attrs: { id: 'format-qc', value: 12 },
          class: 'form-control'
        })
      ])

      const buttonElement = h('div', {class: 'col-sm-12'}, [
        h('button', {
          class: 'btn btn-primary',
          attrs: {id: "fnSaveFormat"}
        }, [h('i', { class: 'fa fa-save' })])
      ]);

      return h('div',{ class: 'row' }, [
        input, buttonElement
      ])
    }
  })

}

function popupFeature() {
  const formFeature = {
    formFields: [
      {name: 'category', value: 'category111'},
      {name: 'ticket', value: 'ticket11'},
      {name: 'title', value: 'title11'},
      {name: 'feature', value: 'featu1re1'},
      {name: 'feature2', value: 'feature2111'},
      
    ],
    remember: false
  }

  const formEvent = {
    add() {
      this.remember = !this.remember
    }
  }

  new Vue({
    el: '#vue-import-feature',
    data: formFeature,
    methods: formEvent,
    render(h) {
      const vm = this;
      const formElements = vm.formFields.map(field => 
        h('div', { class: 'col-md-12' }, [
          h('div', { class: 'form-group' }, [
            h('input', { 
              attrs: { 
                type: "text", 
                id: field.name, 
                placeholder: field.name,
                value: field.value
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
              attrs: { type: 'checkbox', id: 'gridCheck' },
              class: 'form-check-input',
              domProps: {
                checked: this.remember
              }
            }),
            h('label', { 
              attrs: { for: 'gridCheck' },
              class: 'form-check-label' 
            }, 'Remember')
          ])
        ])
      ]);

      const buttonElement = h('div', { class: 'col-md-3' }, [
        h('button', {
          class: 'btn btn-primary',
          attrs: {id: "fnSaveFeature"},
          on: {
            click: this.add
          }
        }, [h('i', { class: 'fa fa-save' })])
      ]);

      const alertElement = h('div', { 
        class: `alert alert-success alert-dismissible col-md-5`, 
        attrs: { role: 'alert' },
        style: { padding: '6px', margin: '0' } 
      }, [
        h('button', { 
          class: 'close', 
          attrs: { type: 'button', 'data-dismiss': 'alert', 'aria-label': 'Close' },
          style: { padding: '5px' }
        }, [
          h('span', { attrs: { 'aria-hidden': 'true' } }, 'x')
        ]),
        h('strong', 'Success!')
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

function popupMapping() {
  const formMapping = {
    formFields: [
      {name: 'Comment', valueSrc: 2, valueDes: 4},
      {name: 'Function', valueSrc: 2, valueDes: 5},
      {name: 'Hour', valueSrc: 2, valueDes: 3},
      {name: 'Phase', valueSrc: 2, valueDes: null}
    ]
  }

  const formEvent = {
    save() {
      var mapdata = [
        new Mapping("hour", $('#destination-hour').val(), $('#resource-hour').val()),
        new Mapping("comment", $('#destination-comment').val(), $('#resource-comment').val()),
        new Mapping("function", $('#destination-function').val(), $('#resource-function').val()),
        new Mapping("phase", $('#destination-phase').val(), $('#resource-phase').val())
      ];

      chrome.storage.sync.get(["RKSetings"], function(items) {
        if (items == undefined) {
          items = {};
        }
        items.mapper = mapdata;
        chrome.storage.sync.set({"RKSetings": items}, function() {
          alert('Settings saved');
        });
      });
    }
  }

  new Vue({
		el: '#vue-map-qc',
		data: formMapping,
    methods: formEvent,
		render(h) {
		  const vm = this;
	
		  // Tạo các hàng cho từng trường
		  const rows = vm.formFields.map(item => 
			h('div', { class: 'row mb-3' }, [
			  h('label', { class: 'col-sm-4 col-form-label' }, item.name),
			  h('div', { class: 'col-sm-3' }, [
          h('input', { 
            attrs: { id: `resource-${item.name.toLowerCase()}`, placeholder: 'Excel', value: item.valueSrc },
            class: 'form-control'
          })
			  ]),
			  h('div', { class: 'col-sm-3' }, [
          h('input', { 
            attrs: { id: `destination-${item.name.toLowerCase()}`, placeholder: 'QC', value: item.valueDes },
            class: 'form-control'
          })
			  ])
			])
		  );
	
		  // Nút lưu
		  const saveButton = h('button', { 
        class: 'btn btn-primary', 
        attrs: { type: 'button', id: 'fnSaveMapping' },
        on: { click: this.save}
		  }, [
			  h('i', { class: 'fa fa-save' })
		  ]);
	
		  return h('div', [ ...rows, saveButton ]);
		}
	});
}