import React, { CSSProperties } from "react"
import styled from "styled-components"
import { getApiUrl } from "../share/Configuration"
import { SearchApi, Node } from "../share/searchApi"
import { ProjectList } from "./ProjectList"
import { FileList } from "./FileList"
import { FileContent } from "./FileContent"
import { Segment } from "semantic-ui-react"
import swal from "sweetalert2"

type Props = {
    styleR: string
    styleL: string
    style: CSSProperties
    status: boolean
    onLogoutPlease: () => void
}

type State = {
    // selectedFile: string
    projectName: string
    projectPath: string
    projectContent: string
    dropdownOption: any[]
    pathProject: string[]
    fileName: string[]
    treeJson: string
    nodes: Node[]
    selectedNode: Node
    extention: string
    demoContent: string
    formatPass: boolean
    originContent: string
}

const BodyDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  position: absolute;
  width:100%;
  height: 90%;
`

const LeftDiv = styled.div`
  display: absolute;
  flex-direction: column;
  flex-grow: 1;
  padding: 5px;
  left: 0;
  top: 0;
  height: calc(80% - 50px);
  min-width: 350px;
  min-height: 10%;
  resize:vertical;
  max-width: 20%;
`

const RightDiv = styled.div`
  max-width:400px;
  display: absolute;
  flex-direction: column;
  flex-grow: 1;
  padding: 5px;
  right: 0;
  top: 0;
  width: 60%;
  min-width: 65%;
  min-height: 20%;
  resize:vertical;
  height: calc(100% - 30px);
`

export class Body extends React.Component<Props, State> {

    private searchApi = new SearchApi(getApiUrl());

    constructor(props) {
        super(props);
        this.state = {
            // selectedFile: "",
            projectName: "",
            projectPath: "",
            projectContent: "",
            dropdownOption: [],
            pathProject: [],
            fileName: [],
            treeJson: "",
            nodes: [],
            selectedNode: {
                name: "",
                id: 0,
                isRoot: true,
                parent: 0,
                isFile: false,
                pathFile: "",
                modifieDate: "",
                fileType: ""
            },
            extention: "",
            demoContent: "",
            formatPass: null,
            originContent: ""
        }
    }

    public componentDidMount() {
        this.searchApi.getProjectNames().then(res => {
            let options = res.data.map(x => ({ value: x, text: x, icon: "folder" }))
            this.setState({ dropdownOption: options })
            // ได้ค่าโปรเจคทั้งหมดมาเก็บในoption
            this.defaultValue()
        })
            .catch(err => {
                if (err.response.status === 401) {
                    this.props.onLogoutPlease()
                }
            })
        let exten = this.state.selectedNode.fileType
        let pattern = this.getLanguage(exten)
        this.setState({
            extention: pattern
        })
    }

    private defaultValue() {
        this.searchApi.getProjectNames().then(res => {
            let name = res.data.map(x => x)
            this.setState({ projectName: name[0] })
            this.initProjectSettings(name[0])
        })
            .catch(err => {
                if (err.response.status === 401) {
                    this.props.onLogoutPlease()
                }
            })

    }

    private getRoot = (): Node => {
        if (this.state.nodes.length) {
            return this.state.nodes.filter(x => x.isRoot)[0];
        } else {
            return {
                name: "Loading ...",
                isRoot: true,
                isFile: false,
                id: 0,
                parent: 0,
                pathFile: "",
                modifieDate: "",
                fileType: ""
            }
        }
    }

    public isSelected = (node) => this.state.selectedNode === node;

    public initProjectSettings(name: string) {
        this.searchApi.getProjectSettings(name).then(response => {

            let pathProjects = [];
            console.log("getprojectsettings")
            console.log(response.data)
            pathProjects = response.data.files;
            this.searchApi.getPath(name).then(res => {
                this.searchApi.getNode(res.data.path).then(rs => {
                    this.setState({ nodes: rs.data })
                })
            })
                .catch(err => {
                    if (err.response.status === 401) {
                        this.props.onLogoutPlease()
                    }
                })
            this.setState({ projectPath: pathProjects[0] })
            this.setState({ fileName: this.state.nodes.map(x => x.name) })
            this.initSettingContent(this.state.projectPath)
        })
    }

    public initSettingContent(value: string) {
        this.searchApi.getSettingContent(value).then(response => {
            this.setState({
                projectContent: response.data.content, projectPath: response.data.path
                , originContent: response.data.content
            })
        })
            .catch(err => {
                if (err.response.status === 401) {
                    this.props.onLogoutPlease()
                }
            })
    }
    private initDemoContent = (path: string, content: string) => {
        this.searchApi.getDemo(path, content).then(res => {
            this.setState({ demoContent: res.data.content, formatPass: res.data.pass })
        })
            .catch(err => {
                if (err.response.status === 401) {
                    this.props.onLogoutPlease()
                }
            })
    }
    private initSaveSettingContent = (path: string, content: string) => {
        if (!this.state.projectName) {
            swal(
                "warning!",
                "Please select Project.",
                "warning"
            )
        }
        if (!this.state.projectPath || !this.state.projectContent) {
            swal(
                "warning!",
                "Please select Path.",
                "warning"
            )
        }
        this.searchApi.saveSettingContent(path, content).then(res => {
            if (res.data.success) {
                swal({
                    position: "center",
                    type: "success",
                    title: "Your file has been saved",
                    showConfirmButton: false,
                    timer: 1200
                })
            } else {
                swal(
                    "Error!",
                    Error.toString(),
                    "error"
                )
            }
        })
    }

    private onProjectChange = (project) => {
        this.setState({
            projectName: project,
            projectContent: "",
            projectPath: "",
            fileName: [],
            pathProject: [],
            nodes: [],
            selectedNode: {
                name: "",
                id: 0,
                isRoot: true,
                parent: 0,
                isFile: false,
                pathFile: "",
                modifieDate: "",
                fileType: ""
            }
        })
        this.initProjectSettings(project)
    }

    private getLanguage(extension: string) {
        const langs = {
            ".json": "json",
            ".xml": "xml",
            ".config": "xml",
            ".properties": "ini"
        }
        let lang = langs[extension];
        return lang === null ? "json" : lang
    }

    private onSelect = (node) => {
        let pathFile = node.pathFile
        let exten = node.fileType
        let pattern = this.getLanguage(exten)
        this.setState({
            selectedNode: node,
            projectPath: pathFile,
            extention: pattern
        })
        this.initSettingContent(pathFile)
    }
    private onDemo = () => {
        this.initDemoContent(this.state.projectPath, this.state.projectContent)
    }

    private onSaveContent = (content) => {
        this.setState({
            projectContent: content,
        });
        this.initSaveSettingContent(this.state.projectPath, content)
        this.searchApi.getPath(this.state.projectName).then(res => {
            this.searchApi.getNode(res.data.path).then(rs => {
                this.setState({ nodes: rs.data })
            })
                .catch(err => {
                    if (err.response.status === 401) {
                        this.props.onLogoutPlease()
                    }
                })
            this.initSettingContent(this.state.projectPath)
        })
    }

    private onDiscard = () => {
        this.initSettingContent(this.state.projectPath)
    }

    private onContentChange = (content) => {
        this.setState({ projectContent: content })
        this.onDemo();
    }

    public render() {
        let { projectName, projectPath, dropdownOption, fileName
            , pathProject, projectContent, demoContent, selectedNode
            , formatPass, originContent } = this.state
        return (
            <BodyDiv style={this.props.style}>
                <LeftDiv className={this.props.styleL}>
                    <Segment>
                        <ProjectList projectName={projectName} dropdownOption={dropdownOption} onChange={this.onProjectChange} />
                        <div className="box">
                            <FileList onDiscard={this.onDiscard} demoText={demoContent} newContent={projectContent} oldContent={originContent} isSelected={this.isSelected}
                                onSelect={this.onSelect} nodes={this.state.nodes} folder={this.getRoot()}
                                onChange={this.onSaveContent} projectPath={projectPath} fileName={fileName} pathProject={pathProject}
                                extention={this.state.extention} pass={formatPass} onDemo={this.onDemo} />
                        </div>
                    </Segment>
                </LeftDiv>
                <RightDiv className={this.props.styleR}>
                    <FileContent pass={formatPass} projectPath={projectPath} selectNode={selectedNode} demoText={demoContent} onDemo={this.onDemo} extention={this.state.extention}
                        ProjectContent={projectContent} onChange={this.onSaveContent} onContentChange={this.onContentChange} />
                </RightDiv>
            </BodyDiv>
        );
    }
}