(function () {

    class Row {
        constructor(lineNum, maxCharCount = null) {

            this.maxCharCount = maxCharCount;
            this.elementLineNum = null;
            this.elementInputText = null;
            this.elementCharCount = null;

            const template = document.createElement('template');

            template.innerHTML = `<span class="multiline-input__line-num">${lineNum}</span>`;
            this.elementLineNum = template.content.firstChild;

            template.innerHTML = `<input type="text" class="multiline-input__input-text"></input>`;
            this.elementInputText = template.content.firstChild;
            this.elementInputText.rowNumber = lineNum;

            template.innerHTML = `<span class="multiline-input__number-of-char-in-line">${0}</span>`;
            this.elementCharCount = template.content.firstChild;

            this.elementInputText.addEventListener('input', this.recalcCharCount.bind(this));
        }

        recalcCharCount() {
            this.elementCharCount.textContent = this.elementInputText.value.length;
        }
    }

    class RowList {
        constructor(multilineInput = null) {
            this.rowList = [];
            this.domContainer = multilineInput;
            this.maxCharCountInRow = Number(multilineInput.getAttribute('maxCharCountInRow')) || null;
            this.maxRowCount = Number(multilineInput.getAttribute('maxRowCount')) || null;

            this.currentRow = null;

            // Пусть всегда будет первая строка
            this.addRow(0);

            // Клик вне строк, когда осталось свобоное место в контенере
            this.domContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'DIV') {
                    this._focus(this.rowCount() - 1);
                }
            });
        }

        _push(row) {
            this.rowList.push(row);

            if (this.domContainer) {
                this.domContainer.append(row.elementLineNum);
                this.domContainer.append(row.elementInputText);
                this.domContainer.append(row.elementCharCount);
            }
        }

        _splice(row, index) {
            this.rowList.splice(index, 0, row);

            if (index > 0) {
                this.rowList[index - 1].elementCharCount.after(row.elementLineNum);
                row.elementLineNum.after(row.elementInputText);
                row.elementInputText.after(row.elementCharCount);
            } else if (index === 0) {
                this.domContainer.prepend(row.elementLineNum);
                this.domContainer.prepend(row.elementInputText);
                this.domContainer.prepend(row.elementCharCount);
            }

            this._recalcLineNumbers(index);
        }

        _recalcLineNumbers(index) {
            const listSize = this.rowCount();
            for (let i = index; i < listSize; i++) {
                this.rowList[i].elementLineNum.textContent = i + 1;
                this.rowList[i].elementInputText.rowNumber = i + 1;
            }
        }

        _focus(index) {
            this.rowList[index].elementInputText.focus();
        }

        rowCount = () => (this.rowList.length)

        addRow(index) {
            const newRow = new Row(this.rowCount() + 1, this.maxCharCountInRow);
            newRow.elementInputText.addEventListener('keydown', this.keydownHandler.bind(this));
            newRow.elementInputText.addEventListener('input', this.inputHandler.bind(this));
            if (this.rowCount() > 0) {
                this._splice(newRow, index);
            } else {
                this._push(newRow);
            }
        }

        removeRow(index) {
            // вопрос: если мы удаляем элемент дома, у которого есть слушатель, удаляется ли слушатель?
            // пока что думаем, что да

            this.rowList[index].elementCharCount.remove();
            this.rowList[index].elementInputText.remove();
            this.rowList[index].elementLineNum.remove();

            this.rowList.splice(index, 1);
            this._recalcLineNumbers(index);
        }

        keydownHandler(event) {
            const currentRowNumber = event.target.rowNumber - 1;
            const currentRowValue = event.target.value;
            const carriagePosition = event.target.selectionStart;
            console.log(event.code);
            switch (event.code) {
                case 'Enter':
                    if (this.rowCount() < this.maxRowCount) {
                        event.target.value = currentRowValue.slice(0, carriagePosition);

                        this.addRow(currentRowNumber + 1);
                        this._focus(currentRowNumber + 1);

                        this.rowList[currentRowNumber + 1].elementInputText.value = currentRowValue.slice(carriagePosition);
                        this.rowList[currentRowNumber + 1].elementInputText.selectionStart = 0;
                        this.rowList[currentRowNumber + 1].elementInputText.selectionEnd = 0;

                        this.rowList[currentRowNumber].recalcCharCount();
                        this.rowList[currentRowNumber + 1].recalcCharCount();
                    }
                    break;
                case 'Backspace':
                    if (carriagePosition === 0 && currentRowNumber > 0) {
                        event.preventDefault();

                        const prevRowValue = this.rowList[currentRowNumber - 1].elementInputText.value;

                        const sum = prevRowValue + currentRowValue;

                        if (sum.length <= this.maxCharCountInRow) {
                            this.rowList[currentRowNumber - 1].elementInputText.value = sum;
                            this.removeRow(currentRowNumber);
                        } else {
                            this.rowList[currentRowNumber - 1].elementInputText.value = sum.slice(0, this.maxCharCountInRow);
                            this.rowList[currentRowNumber].elementInputText.value = sum.slice(this.maxCharCountInRow);
                            this.rowList[currentRowNumber].recalcCharCount();
                        }

                        this.rowList[currentRowNumber - 1].recalcCharCount();

                        this._focus(currentRowNumber - 1);

                        this.rowList[currentRowNumber - 1].elementInputText.selectionStart = prevRowValue.length;
                        this.rowList[currentRowNumber - 1].elementInputText.selectionEnd = prevRowValue.length;
                    }
                    break;
                case 'Delete':
                    if (carriagePosition === currentRowValue.length && currentRowNumber < this.rowCount() - 1) {                                                    
                        event.preventDefault();

                        const nextRowValue = this.rowList[currentRowNumber + 1].elementInputText.value;
                        const sum = currentRowValue + nextRowValue;

                        if (sum.length <= this.maxCharCountInRow) {
                            this.rowList[currentRowNumber].elementInputText.value = sum;
                            this.removeRow(currentRowNumber + 1);

                            this.rowList[currentRowNumber].elementInputText.selectionStart = carriagePosition;
                            this.rowList[currentRowNumber].elementInputText.selectionEnd = carriagePosition;
                        } else {
                            this.rowList[currentRowNumber].elementInputText.value = sum.slice(0, this.maxCharCountInRow);
                            this.rowList[currentRowNumber + 1].elementInputText.value = sum.slice(this.maxCharCountInRow + ((carriagePosition === this.maxCharCountInRow) ? 1 : 0));
                            this.rowList[currentRowNumber + 1].recalcCharCount();

                            this.rowList[currentRowNumber].elementInputText.selectionStart = carriagePosition;
                            this.rowList[currentRowNumber].elementInputText.selectionEnd = carriagePosition;
                        }

                        this.rowList[currentRowNumber].recalcCharCount();                   
                    }
                    break;
                case 'ArrowDown':
                    if (currentRowNumber < this.rowCount() - 1) {
                        this._focus(currentRowNumber + 1);
                    }
                    break;
                case 'ArrowUp':
                    if (currentRowNumber > 0) {
                        this._focus(currentRowNumber - 1);
                    }
                    break;
                case 'ArrowLeft':
                    if (carriagePosition === 0 && currentRowNumber > 0) {
                        event.preventDefault();

                        const prevRowValue = this.rowList[currentRowNumber - 1].elementInputText.value;

                        this._focus(currentRowNumber - 1);

                        this.rowList[currentRowNumber - 1].elementInputText.selectionStart = prevRowValue.length;
                        this.rowList[currentRowNumber - 1].elementInputText.selectionEnd = prevRowValue.length;
                    }
                    break;
                case 'ArrowRight':
                    if (carriagePosition === currentRowValue.length && currentRowNumber < this.rowCount()) {
                        event.preventDefault();

                        this._focus(currentRowNumber + 1);

                        this.rowList[currentRowNumber + 1].elementInputText.selectionStart = 0;
                        this.rowList[currentRowNumber + 1].elementInputText.selectionEnd = 0;
                    }
                    break;
            }
        }

        inputHandler(event) {
            const currentRowValue = event.target.value;
            const currentRowNumber = event.target.rowNumber - 1;
            let input_value = currentRowValue;
            let row_input_index = 0;

            if (input_value.length > this.maxCharCountInRow) {
                event.target.value = input_value.slice(0, this.maxCharCountInRow);
                this.rowList[currentRowNumber + row_input_index].recalcCharCount();

                input_value = input_value.slice(this.maxCharCountInRow);
                row_input_index += 1;

                while (input_value.length > 0 && this.rowCount() < this.maxRowCount) {
                    this.addRow(currentRowNumber + row_input_index);
                    this.rowList[currentRowNumber + row_input_index].elementInputText.value = input_value.slice(0, this.maxCharCountInRow);
                    this.rowList[currentRowNumber + row_input_index].recalcCharCount();

                    this._focus(currentRowNumber + row_input_index);

                    input_value = input_value.slice(this.maxCharCountInRow);
                    row_input_index += 1;
                }
            }
        }
    }

    //нашли первый multiline-input
    const multilineInput = document.querySelector('.multiline-input');
    const rowList = new RowList(multilineInput);
})();

